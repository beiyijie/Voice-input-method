"""语音识别核心 - 支持多语言（普通话/英语/粤语）"""
import numpy as np
from funasr import AutoModel

_models: dict[str, AutoModel] = {}
_warmed: set[str] = set()

MODEL_MAP = {
    "zh": {
        "model": "iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
        "vad_model": "iic/speech_fsmn_vad_zh-cn-16k-common-pytorch",
        "punc_model": "iic/punc_ct-transformer_zh-cn-common-vocab272727-pytorch",
        "disable_update": True,
    },
    "en": {
        "model": "paraformer-en",
        "disable_update": True,
    },
    "yue": {
        "model": "iic/SenseVoiceSmall",
        "disable_update": True,
    },
}


def get_model(language: str = "zh") -> AutoModel:
    config = MODEL_MAP.get(language, MODEL_MAP["zh"])
    model_key = config["model"]
    if language not in _models:
        print(f"Loading model for {language}: {model_key}", flush=True)
        _models[language] = AutoModel(**config)
    return _models[language]


def prewarm(languages: list[str] | None = None):
    """Pre-load models at server startup so first recognition is fast."""
    if languages is None:
        languages = ["zh"]
    for lang in languages:
        if lang in _warmed:
            continue
        print(f"Pre-warming FunASR model ({lang})...", flush=True)
        model = get_model(lang)
        dummy = np.zeros(16000, dtype=np.float32)
        dummy2 = np.zeros(24000, dtype=np.float32)

        if lang == "yue":
            from funasr.utils.postprocess_utils import rich_transcription_postprocess
            result = model.generate(input=dummy, language="yue", use_itn=True)
            rich_transcription_postprocess(result[0]["text"]) if result else ""
            model.generate(input=dummy2, language="yue", use_itn=True)
        else:
            model.generate(input=dummy)
            model.generate(input=dummy2, hotwords=["test"])
        _warmed.add(lang)
        print(f"FunASR model ({lang}) ready", flush=True)


def recognize(audio_bytes: bytes, hotwords: list[str] | None = None, language: str = "zh") -> str:
    """对音频进行识别，返回文本。支持语言: zh/en/yue"""
    model = get_model(language)
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    if language == "yue":
        from funasr.utils.postprocess_utils import rich_transcription_postprocess
        result = model.generate(input=audio_array, language="yue", use_itn=True)
        if result:
            return rich_transcription_postprocess(result[0]["text"])
        return ""
    else:
        result = model.generate(
            input=audio_array,
            hotwords=hotwords or [],
        )
        return result[0]["text"] if result else ""
