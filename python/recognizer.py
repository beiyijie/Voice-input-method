"""语音识别核心 - 使用 FunASR paraformer"""
import numpy as np
from funasr import AutoModel

_model = None


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


def recognize(audio_bytes: bytes, hotwords: list[str] | None = None) -> str:
    """对音频进行识别，返回文本"""
    model = get_model()
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    result = model.generate(
        input=audio_array,
        hotwords=hotwords or [],
    )
    return result[0]["text"] if result else ""
