import React, { useRef, useCallback, useEffect } from 'react';

function AudioRecorder({ isRecording, onToggleRecording, onRecordingComplete, onStop, timer }) {
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const stoppedByUserRef = useRef(false);
  const barsRef = useRef([]);

  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || barsRef.current.length === 0) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const bars = barsRef.current;
      const step = Math.floor(bufferLength / bars.length);
      bars.forEach((bar, i) => {
        if (bar) {
          const value = dataArray[i * step] || 0;
          const height = 8 + (value / 255) * 40;
          bar.style.height = `${height}px`;
        }
      });
    };
    draw();
  }, []);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleStart = async () => {
    stoppedByUserRef.current = false;
    onToggleRecording();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (stoppedByUserRef.current) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          onRecordingComplete(blob);
        }
        setTimeout(() => cleanup(), 100);
      };

      mediaRecorder.start();
    } catch (err) {
      toast_error('Microphone access denied');
      onToggleRecording();
    }
  };

  const handleStop = () => {
    stoppedByUserRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (onStop) {
      onStop();
    } else {
      onToggleRecording();
    }
  };

  const handlePause = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      } else if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
    }
  };

  const formatTime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const barHeights = [12, 24, 18, 36, 28, 42, 20, 32, 16, 38, 22, 30, 14, 40, 26, 34, 18, 28, 44, 20, 36, 12, 30, 22, 38, 16, 42, 24, 32, 20];

  return (
    <div className="record-area">
      <div className={`record-btn-ring${isRecording ? ' recording' : ''}`}>
        <div
          className="record-btn-inner"
          onClick={isRecording ? undefined : handleStart}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </div>
      </div>
      <div className="record-timer">{formatTime(timer || 0)}</div>
      <div className={`record-status${isRecording ? ' active' : ''}`}>
        {isRecording ? 'Recording...' : 'Ready to record'}
      </div>

      {/* Waveform */}
      <div className={`waveform-bars${isRecording ? ' active' : ''}`}>
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="waveform-bar"
            ref={(el) => { barsRef.current[i] = el; }}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Controls (visible when recording) */}
      <div className={`record-controls${isRecording ? '' : ' hidden'}`}>
        <button className="btn btn-secondary btn-sm" onClick={handlePause} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          Pause
        </button>
        <button className="btn btn-danger btn-sm" onClick={handleStop} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
          Stop &amp; Process
        </button>
      </div>
    </div>
  );
}

// Simple toast fallback for mic error
function toast_error(msg) {
  try {
    const { toast } = require('react-toastify');
    toast.error(msg);
  } catch {
    // silent
  }
}

export default AudioRecorder;
