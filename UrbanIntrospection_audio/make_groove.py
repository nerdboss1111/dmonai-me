"""Make an original, loopable instrumental for Urban Introspection."""
from pathlib import Path
import subprocess
import wave

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 32000
BPM = 90
BEAT = 60 / BPM
BARS = 16
SECONDS = BARS * 4 * BEAT
LENGTH = round(SECONDS * RATE)
TAIL = RATE * 3
rng = np.random.default_rng(81407)
mix = np.zeros((LENGTH + TAIL, 2), dtype=np.float64)
keys = np.zeros_like(mix)

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def place(bus, signal, at, level=1.0, pan=0.0):
    start = max(0, round(at * RATE))
    count = min(len(signal), len(bus) - start)
    if count <= 0:
        return
    angle = (max(-1, min(1, pan)) + 1) * np.pi / 4
    bus[start:start + count, 0] += signal[:count] * level * np.cos(angle)
    bus[start:start + count, 1] += signal[:count] * level * np.sin(angle)

def envelope(t, attack, release, duration):
    return (1 - np.exp(-t / attack)) * np.clip((duration - t) / release, 0, 1)

def electric_note(note, duration, decay=1.3):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    modulation = .65 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .23)
    body = np.sin(2 * np.pi * f * t + modulation)
    overtone = .22 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / .42)
    return (body + overtone) * np.exp(-t / decay) * envelope(t, .008, .25, duration)

def soft_pad(note, duration):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    tone = (np.sin(2 * np.pi * f * t) + .55 * np.sin(2 * np.pi * f * 1.003 * t) +
            .12 * np.sin(2 * np.pi * f * 2 * t)) / 1.67
    return tone * envelope(t, .38, .75, duration)

def bass(note, duration):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    tone = np.sin(2 * np.pi * f * t) + .16 * np.sin(2 * np.pi * 2 * f * t)
    return tone * np.exp(-t * .7) * envelope(t, .012, .14, duration)

def kick():
    t = np.arange(round(.42 * RATE)) / RATE
    phase = 2 * np.pi * (47 * t + 80 * .023 * (1 - np.exp(-t / .023)))
    return np.sin(phase) * np.exp(-t * 12) + .045 * rng.standard_normal(len(t)) * np.exp(-t * 110)

snare_filter = butter(3, [750, 9000], btype='bandpass', fs=RATE, output='sos')
hat_filter = butter(3, 6500, btype='highpass', fs=RATE, output='sos')

def snare():
    t = np.arange(round(.27 * RATE)) / RATE
    n = sosfilt(snare_filter, rng.standard_normal(len(t)))
    return .7 * n * np.exp(-t * 20) + .3 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 24)

def hat():
    t = np.arange(round(.08 * RATE)) / RATE
    return sosfilt(hat_filter, rng.standard_normal(len(t))) * np.exp(-t * 70)

# Four mellow chords. The extended notes keep the beat airy and colorful.
chords = [[53, 57, 60, 64], [50, 53, 57, 60], [48, 52, 55, 59], [48, 52, 57, 62]]
roots = [38, 34, 41, 36]
melody = [74, 77, 81, 79, 76, 74, 72, 69, 72, 74, 77, 76, 74, 72, 69, 72]
for bar in range(BARS):
    start = bar * 4 * BEAT
    chord = chords[bar % 4]
    for j, note in enumerate(chord):
        place(keys, soft_pad(note, 4 * BEAT + .7), start, .032, (-.6 + j * .4))
        place(keys, electric_note(note, 2.9), start + .014 * j, .046, (-.55 + j * .36))
        if j in (1, 3):
            place(keys, electric_note(note + 12, 1.3, .75), start + 2.5 * BEAT + j * .009, .025, .25 - j * .16)
    root = roots[bar % 4]
    for pos, note, vel in [(0, root, .16), (1.5, root + 7, .09), (2.5, root, .13), (3.5, root + 12, .075)]:
        place(mix, bass(note, .58), start + pos * BEAT, vel, 0)
    for pos, vel in [(0, .29), (1.75, .12), (2.5, .2)]:
        place(mix, kick(), start + pos * BEAT, vel)
    for pos, vel in [(1, .14), (3, .15)]:
        place(mix, snare(), start + pos * BEAT, vel, -.12 if pos == 1 else .12)
    for eighth in range(8):
        swing = .045 * BEAT if eighth % 2 else 0
        place(mix, hat(), start + eighth * .5 * BEAT + swing, .025 if eighth % 2 else .038, rng.uniform(-.35, .35))
    # Leave space in the melody; it should support the artwork, not crowd it.
    if bar % 4 != 2:
        for pos, index, vel in [(0.5, bar, .055), (1.5, bar + 2, .045), (3.0, bar + 4, .05)]:
            place(keys, electric_note(melody[index % len(melody)], 1.8, .85), start + pos * BEAT, vel, rng.uniform(-.6, .6))

# Gentle stereo echoes wrap at the loop boundary so the restart has no hard cut.
mix += keys
for delay, gain in [(.19, .11), (.38, .075), (.61, .04)]:
    offset = round(delay * RATE)
    mix[offset:, 0] += keys[:-offset, 1] * gain
    mix[offset:, 1] += keys[:-offset, 0] * gain
mix[:TAIL] += mix[LENGTH:LENGTH + TAIL]
mix = mix[:LENGTH]
mix = np.tanh(mix * .92)
peak = np.max(np.abs(mix))
mix *= .84 / peak
pcm = np.int16(np.clip(mix, -1, 1) * 32767)
outdir = Path(__file__).resolve().parent
outdir.mkdir(exist_ok=True)
wav = outdir / 'city-groove-source.tmp.wav'
with wave.open(str(wav), 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(RATE); f.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', '160k', str(outdir / 'city-groove.mp3')], check=True)
wav.unlink()
print('Created original city groove:', round(SECONDS, 2), 'seconds, peak', round(float(peak), 4))
