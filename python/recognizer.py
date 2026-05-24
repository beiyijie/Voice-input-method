"""语音识别核心 - 使用 FunASR paraformer"""
import numpy as np
from funasr import AutoModel

_model = None
_warmed = False


def get_model():
    global _model
    if _model is None:
        _model = AutoModel(
            model="iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
            vad_model="iic/speech_fsmn_vad_zh-cn-16k-common-pytorch",
            punc_model="iic/punc_ct-transformer_zh-cn-common-vocab272727-pytorch",
            disable_update=True,
        )
    return _model


def prewarm():
    """Pre-load model at server startup so first recognition is fast."""
    global _warmed
    if not _warmed:
        print("Pre-warming FunASR model...", flush=True)
        model = get_model()
        # Run a tiny dummy input to trigger model initialization
        dummy = np.zeros(16000, dtype=np.float32)  # 1 second of silence
        model.generate(input=dummy)
        # Run a second pass with different size to trigger CUDA kernel compilation
        dummy2 = np.zeros(24000, dtype=np.float32)  # 1.5 seconds (different size)
        model.generate(input=dummy2, hotwords=["test"])
        _warmed = True
        print("FunASR model ready", flush=True)


def recognize(audio_bytes: bytes, hotwords: list[str] | None = None) -> str:
    """对音频进行识别，返回文本"""
    model = get_model()
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    result = model.generate(
        input=audio_array,
        hotwords=hotwords or [],
    )
    return result[0]["text"] if result else ""
