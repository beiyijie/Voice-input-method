"""WebSocket 服务 - 接收 Electron 指令，返回识别结果"""
import asyncio
import json
import os
import time
import numpy as np
import sounddevice as sd
import websockets

from recognizer import recognize
from vad import VAD

SAMPLE_RATE = 16000
CHANNELS = 1
WS_PORT = 9877

_recording = False
_audio_buffer: list[bytes] = []
_recording_task: asyncio.Task | None = None


async def run_recording(websocket, hotwords: list[str], vad: VAD):
    """Run the recording loop in a separate task."""
    global _recording, _audio_buffer

    _recording = True
    _audio_buffer = []
    last_recognized_idx = 0
    partial_text = ""
    vad.reset()

    async def send_msg(msg: dict):
        await websocket.send(json.dumps(msg, ensure_ascii=False))

    await send_msg({"type": "recording_started"})

    def audio_callback(indata, frames, time_info, status):
        if _recording:
            _audio_buffer.append(indata.copy().tobytes())

    stream = sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype="int16",
        blocksize=1600,
        callback=audio_callback,
    )

    loop = asyncio.get_event_loop()

    with stream:
        last_partial_time = time.time()
        while _recording:
            await asyncio.sleep(0.1)

            # VAD check on the latest chunk
            if len(_audio_buffer) > 0:
                chunk = np.frombuffer(_audio_buffer[-1], dtype=np.int16)
                should_stop = vad.process(chunk.astype(np.float32) / 32768.0)
                if should_stop:
                    _recording = False
                    break

            # Every ~0.8s, send incremental recognition result
            now = time.time()
            buf_len = len(_audio_buffer)
            if buf_len > last_recognized_idx and now - last_partial_time > 0.8:
                last_partial_time = now
                new_audio = b"".join(_audio_buffer[last_recognized_idx:])
                last_recognized_idx = buf_len
                new_text = await loop.run_in_executor(None, recognize, new_audio, hotwords)
                if new_text:
                    partial_text += new_text
                    await send_msg({"type": "partial_result", "text": partial_text})

    # Final recognition on full audio (runs after recording stops)
    if _audio_buffer:
        all_audio = b"".join(_audio_buffer)
        text = await loop.run_in_executor(None, recognize, all_audio, hotwords)
        await send_msg({"type": "final_result", "text": text})


async def handle_client(websocket):
    global _recording, _audio_buffer, _recording_task

    async def send(msg: dict):
        await websocket.send(json.dumps(msg, ensure_ascii=False))

    await send({"type": "ready", "pid": os.getpid()})

    async for raw_msg in websocket:
        msg = json.loads(raw_msg)
        msg_type = msg.get("type")
        hotwords: list[str] = msg.get("hotwords", [])

        if msg_type == "start_recording":
            if _recording_task is not None and not _recording_task.done():
                _recording = False
                _recording_task.cancel()
                _recording_task = None

            vad = VAD()
            _recording_task = asyncio.create_task(
                run_recording(websocket, hotwords, vad)
            )

        elif msg_type == "stop_recording":
            _recording = False
            _recording_task = None  # Don't await - let final result arrive later
            await send({"type": "recording_stopped"})

        elif msg_type == "shutdown":
            _recording = False
            if _recording_task is not None:
                _recording_task.cancel()
                _recording_task = None
            await send({"type": "shutdown_ack"})
            break


async def main():
    print(f"Starting voice recognition server on ws://127.0.0.1:{WS_PORT}", flush=True)
    async with websockets.serve(handle_client, "127.0.0.1", WS_PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
