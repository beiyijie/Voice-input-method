"""WebSocket 服务 - 接收 Electron 指令，返回识别结果"""
import asyncio
import json
import os
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


async def handle_client(websocket):
    global _recording, _audio_buffer
    vad = VAD()

    async def send(msg: dict):
        await websocket.send(json.dumps(msg, ensure_ascii=False))

    await send({"type": "ready", "pid": os.getpid()})

    async for raw_msg in websocket:
        msg = json.loads(raw_msg)
        msg_type = msg.get("type")
        hotwords: list[str] = msg.get("hotwords", [])

        if msg_type == "start_recording":
            _recording = True
            _audio_buffer = []
            vad.reset()
            await send({"type": "recording_started"})

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

            with stream:
                while _recording:
                    await asyncio.sleep(0.1)
                    if len(_audio_buffer) > 0:
                        chunk = np.frombuffer(_audio_buffer[-1], dtype=np.int16)
                        should_stop = vad.process(chunk.astype(np.float32) / 32768.0)
                        if should_stop:
                            _recording = False
                            break

            # 录音结束，进行识别
            if _audio_buffer:
                all_audio = b"".join(_audio_buffer)
                loop = asyncio.get_event_loop()
                text = await loop.run_in_executor(None, recognize, all_audio, hotwords)
                await send({"type": "final_result", "text": text})

        elif msg_type == "stop_recording":
            _recording = False
            await send({"type": "recording_stopped"})

        elif msg_type == "shutdown":
            await send({"type": "shutdown_ack"})
            break


async def main():
    print(f"Starting voice recognition server on ws://127.0.0.1:{WS_PORT}", flush=True)
    async with websockets.serve(handle_client, "127.0.0.1", WS_PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
