import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { processAudio } from '../services/api';
import AudioRecorder from '../components/AudioRecorder';

function RecordPage() {
  const [activeTab, setActiveTab] = useState('live');
  const [title, setTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      clearInterval(timerRef.current);
    } else {
      setIsRecording(true);
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleRecordingComplete = useCallback(
    (blob) => {
      const meetingTitle = title.trim() || `Meeting ${new Date().toLocaleDateString()}`;
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('user_id', user.id);
      formData.append('title', meetingTitle);

      setProcessing(true);

      processAudio(formData)
        .then((res) => {
          const meetingId = res.data?.meeting?.id || res.data?.meeting_id || res.data?.id;
          toast.success('Meeting processed successfully!');
          navigate(`/meeting/${meetingId}`);
        })
        .catch((err) => {
          const msg = err.response?.data?.error || 'Failed to process recording';
          toast.error(msg);
        })
        .finally(() => setProcessing(false));
    },
    [title, user.id, navigate],
  );

  const handleFileSelect = (file) => {
    const validExts = ['.mp3', '.wav', '.webm', '.m4a', '.ogg', '.mp4'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error('Please select a valid audio/video file');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    const meetingTitle = title.trim() || `Meeting ${new Date().toLocaleDateString()}`;
    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('user_id', user.id);
    formData.append('title', meetingTitle);

    setProcessing(true);
    try {
      const res = await processAudio(formData);
      const meetingId = res.data?.meeting?.id || res.data?.meeting_id || res.data?.id;
      toast.success('Audio processed successfully!');
      navigate(`/meeting/${meetingId}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to process audio';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (processing) {
    return (
      <div className="page active" data-page="record">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)', gap: 'var(--space-lg)' }}>
          <div className="record-btn-ring recording">
            <div className="record-btn-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <h2 className="text-h1">Processing your meeting...</h2>
          <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>This may take a moment. Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" data-page="record">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="text-h1">Record or Upload</h1>
          <p className="page-subtitle">Capture a meeting live or upload a recording — AI handles the rest.</p>
        </div>
      </div>

      <div className="record-layout">
        {/* Main Card */}
        <div className="record-main-card">
          <input
            className="record-title-input"
            type="text"
            placeholder="Meeting title (e.g. Q2 Planning Session)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Tabs: Live / Upload */}
          <div className="tabs" style={{ marginBottom: 'var(--space-xl)' }}>
            <button
              className={`tab-btn${activeTab === 'live' ? ' active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              Live Recording
            </button>
            <button
              className={`tab-btn${activeTab === 'upload' ? ' active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload File
            </button>
          </div>

          {/* Live Recording Tab */}
          {activeTab === 'live' && (
            <div className="tab-content active">
              <AudioRecorder
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
                onRecordingComplete={handleRecordingComplete}
                onStop={handleStopRecording}
                timer={timer}
              />
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="tab-content active">
              <div
                className={`dropzone${dragActive ? ' active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <div className="dropzone-title">Drop your file here, or click to browse</div>
                <div className="dropzone-desc">Upload audio or video recordings for AI processing</div>
                <div className="dropzone-formats">Supported: MP3, WAV, M4A, MP4, WebM, OGG — up to 500 MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.webm,.m4a,.ogg,.mp4,audio/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
                  }}
                />
              </div>

              {selectedFile && (
                <div className="file-preview">
                  <div className="file-preview-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="file-preview-info">
                    <div className="file-preview-name">{selectedFile.name}</div>
                    <div className="file-preview-size">{formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'Unknown type'}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleUpload}>Process File</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedFile(null)}>Remove</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="record-sidebar">
          <div className="record-sidebar-card">
            <h3 className="text-h3 mb-lg">What happens next</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="process-step">
                <div className="process-step-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div className="process-step-text">
                  <div className="process-step-title">Transcript Generated</div>
                  <div className="process-step-desc">Full text with speaker labels and timestamps</div>
                </div>
              </div>
              <div className="process-step">
                <div className="process-step-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>
                </div>
                <div className="process-step-text">
                  <div className="process-step-title">Summary Extracted</div>
                  <div className="process-step-desc">Key points, decisions, and discussion highlights</div>
                </div>
              </div>
              <div className="process-step">
                <div className="process-step-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div className="process-step-text">
                  <div className="process-step-title">Action Items Extracted</div>
                  <div className="process-step-desc">Tasks with owners, priorities, and due dates</div>
                </div>
              </div>
              <div className="process-step">
                <div className="process-step-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </div>
                <div className="process-step-text">
                  <div className="process-step-title">Report Created</div>
                  <div className="process-step-desc">Shareable meeting report with all insights</div>
                </div>
              </div>
            </div>
          </div>

          <div className="record-sidebar-card" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
            <div className="text-caption mb-sm" style={{ color: 'var(--primary)' }}>Tip</div>
            <p className="text-body-sm">For best results, use a quiet environment and ensure all participants speak clearly. MeetPilotAI can detect up to 8 speakers automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordPage;
