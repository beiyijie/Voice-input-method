"""语音活动检测 - 基于能量阈值检测静音"""
import numpy as np


class VAD:
    def __init__(self, sample_rate: int = 16000, silence_threshold: float = 0.01, silence_duration: float = 1.0):
        self.sample_rate = sample_rate
        self.silence_threshold = silence_threshold
        self.silence_samples = int(silence_duration * sample_rate)
        self.silent_count = 0
        self.is_speaking = False

    def process(self, audio_chunk: np.ndarray) -> bool:
        """返回 True = 应该停止录音（静音超时）"""
        energy = np.sqrt(np.mean(audio_chunk ** 2))
        if energy < self.silence_threshold:
            self.silent_count += len(audio_chunk)
        else:
            self.silent_count = 0
            self.is_speaking = True

        if self.is_speaking and self.silent_count > self.silence_samples:
            return True  # 静音超时，停止录音
        return False

    def reset(self):
        self.silent_count = 0
        self.is_speaking = False
