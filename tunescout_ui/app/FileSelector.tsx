import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from 'next/navigation';
import config from './config.json';
import CloseButton from 'react-bootstrap/CloseButton';

export default function FileSelector ({ disabled, uploadtoAPI, setDisabled, setErrorMsg, setIsError, setWarnMsg, setIsWarning, setTitle }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null); // State to store filename
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMediaTrimmer, setShowMediaTrimmer ] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(true);
  const videoRef = useRef(null);
  const router = useRouter();

  function MediaTrimmer() {
    const [duration, setDuration] = useState(null);

    const handleLoadedMetadata = (e) => {
      const duration = e.target.duration; // Duration in seconds
      setDuration(duration);
      if (e.target.videoHeight === 0) {
        setIsAudioOnly(true);
      } else {
        setIsAudioOnly(false);
      }
    };

    const handleCloseButtonClick = () => {
      setShowMediaTrimmer(false);
      setSelectedFile(null);
      setFileName(null);
      setDisabled(false);
    }

    const TimelineZoom = ({setShowTimelineZoom, clipStart, setClipStart, clipEnd, setClipEnd}) => {
        const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 2 = 200%, etc.
        const MIN_CLIP_DURATION = 1; 
        const MAX_CLIP_DURATION = config.maxDuration;
        const timelineRef = useRef(null);
        const [activeHandle, setActiveHandle] = useState(1); // 0: start handle, 1: end handle
        const [position, setPosition] = useState({ x: 0, y: 0 });
        const [isDragging, setIsDragging] = useState(false);
        const offset = useRef({ x: 0, y: 0 });

        // Refs for Dragging/Panning
        const draggingHandleRef = useRef(null); // 'start', 'end', or 'middle'
        const startDragTimeRef = useRef(0);    // Stores { clipStart, clipEnd } when pan starts
        const startMouseXRef = useRef(0);     // Mouse X position when the drag/pan starts

        const getHandleZIndex = (handleType) => {
          const startPercent = (clipStart / duration) * 100;

          // Base Z-index levels
          const ACTIVE_Z = 100; // Always highest when dragging
          const BACK_Z = 20;    // Lower Z-index for the handle that is behind

          // Prevent deadlock
          if (startPercent > 95.0 && handleType === 'start') {
            return ACTIVE_Z;
          }
          if (startPercent > 95.0 && handleType === 'end') {
            return BACK_Z;
          }

          // When dragging
          if (activeHandle === 0 && handleType === 'start') {
            return ACTIVE_Z; 
          }
          if (activeHandle === 1 && handleType === 'end') {
            return ACTIVE_Z;
          }

          // The handle behind
          if (handleType === 'start') {
            return BACK_Z; 
          }
          if (handleType === 'end') {
            return BACK_Z;
          }
          // Fallback
          return BACK_Z;
        };
        
        const formatTime = (seconds) => {
          const min = Math.floor(seconds / 60);
          const sec = Math.floor(seconds % 60);
          return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        };

        const getSelectedRangeStyle = () => {
          const startPercent = (clipStart / duration) * 100;
          const endPercent = (clipEnd / duration) * 100;
          const widthPercent = endPercent - startPercent;
          return {
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
          };
        };

        // Zoom Timeline dragging
        const handleMouseMove = useCallback((e) => {
          if (!draggingHandleRef.current || !timelineRef.current) return;
          const trackBounds = timelineRef.current.getBoundingClientRect();
          const trackWidth = trackBounds.width;
          const handleType = draggingHandleRef.current;

          // Panning the Entire Bar (Middle Drag)
          if (handleType === 'middle') {
            const mouseDeltaX = e.clientX - startMouseXRef.current;
            // Convert pixel delta to time delta
            const timeDelta = (mouseDeltaX / trackWidth) * duration;
            let newStart = startDragTimeRef.current.clipStart + timeDelta;
            let newEnd = startDragTimeRef.current.clipEnd + timeDelta;
            // Clamp Panning: Ensure the bar stays within the total duration (0 to duration)
            if (newStart < 0) {
              const offset = 0 - newStart; 
              newStart += offset;
              newEnd += offset;
            }
            if (newEnd > duration) {
              const offset = newEnd - duration;
              newStart -= offset;
              newEnd -= offset;
            }
            setClipStart(newStart);
            setClipEnd(newEnd);
            return; // Stop here for pan logic
          }

          // Start/End Drag
          const newPixelPosition = e.clientX - trackBounds.left;
          let newTime = (newPixelPosition / trackWidth) * duration;
          newTime = Math.max(0, Math.min(duration, newTime)); // Total track clamping
          if (handleType === 'start') {
            setActiveHandle(0); 
            const maxStart = clipEnd - MIN_CLIP_DURATION;
            newTime = Math.min(newTime, maxStart);
            //Max Duration Scrubbing
            const currentDuration = clipEnd - newTime;
            if (currentDuration > MAX_CLIP_DURATION) {
              const durationExceededBy = currentDuration - MAX_CLIP_DURATION;
              const newClipEnd = clipEnd - durationExceededBy;
              const finalClipEnd = Math.min(duration, newClipEnd);
                
              // Update both handles
              setClipStart(newTime); // newTime is already track-clamped
              setClipEnd(finalClipEnd);

            } else {
              // If within max duration limit, just update the start handle
              setClipStart(newTime);
              if (clipEnd - newTime <= MIN_CLIP_DURATION) {
                setClipEnd(newTime + MIN_CLIP_DURATION);
              }
            }
          } else if (handleType === 'end') {
            setActiveHandle(1);
            const minEnd = clipStart + MIN_CLIP_DURATION;
            newTime = Math.max(newTime, minEnd);
            // Max Duration Scrubbing
            const currentDuration = newTime - clipStart;
            if (currentDuration > MAX_CLIP_DURATION) {
              const durationExceededBy = currentDuration - MAX_CLIP_DURATION;
              const newClipStart = clipStart + durationExceededBy;
              // Ensure the new clipStart doesn't violate track boundaries (>= 0)
              const finalClipStart = Math.max(0, newClipStart);
                
              // Update both handles
              setClipStart(finalClipStart);
              setClipEnd(newTime); // newTime is already track-clamped

            } else {
              // If within max duration limit, just update the end handle
              setClipEnd(newTime);
              if (newTime - clipStart <= MIN_CLIP_DURATION) {
                setClipStart(newTime - MIN_CLIP_DURATION);
              }
            }
          }
        }, [clipStart, clipEnd, duration]);

        // Clamping to ensure that clipStart is always before clipEnd
        useEffect(() => {
          // Ensure clipStart is always >= 0
          const clampedClipStart = Math.max(0, clipStart);

          // Ensure clipEnd is always <= the duration
          const clampedClipEnd = Math.min(duration, clipEnd);

          // Ensure clipStart is always less than clipEnd
          const validClipStart = Math.min(clampedClipStart, clampedClipEnd);
          const validClipEnd = Math.max(clampedClipStart, clampedClipEnd);

          // Apply the final clamped values back to the state
          if (validClipStart !== clipStart) {
            setClipStart(validClipStart);
          }
          if (validClipEnd !== clipEnd) {
            setClipEnd(validClipEnd);
          }
        }, [clipStart, clipEnd, duration]);

        // Media seeking when the start handle is dragged or panning
        useEffect(() => {
          const video = videoRef.current;
          if (video && video.readyState >= 1 && activeHandle != 1) {
            video.currentTime = clipStart;
          }
        }, [clipStart, activeHandle]);
      
        // Media seeking when the end handle is dragged
        useEffect(() => {
          const video = videoRef.current;
          if (video && video.readyState >= 1 && activeHandle === 1) {
            video.currentTime = clipEnd;
          }
        }, [clipEnd, activeHandle]);

        // Limit the playback to the selected part
        useEffect(() => {
          const video = videoRef.current;
          if (!video) return;

          const handleTimeUpdate = () => {
            if (video.currentTime <= clipStart - 0.001) {
              video.pause();
              video.currentTime = clipStart;
            }
            if (video.currentTime >= clipEnd + 0.001) {
              if (! video.paused) {
                video.currentTime = clipStart;
                video.play();
              } else {
                video.pause();
                video.currentTime = clipStart;
              }
            }
          };

          const handleVideoEnded = () => {
            video.play();
          };

          video.addEventListener('timeupdate', handleTimeUpdate);
          video.addEventListener('ended', handleVideoEnded);

          return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleVideoEnded);
          };
        }, [clipStart, clipEnd, videoRef]);

        // Callback to start the drag operation
        const handleMouseDown = (handleType, e) => {
          // Indicate which handle is being dragged
          draggingHandleRef.current = handleType;
          if (handleType === 'middle') {
            // Store the initial state for the panning calculation
            startDragTimeRef.current = { clipStart, clipEnd };
            startMouseXRef.current = e.clientX;
            e.preventDefault(); // Crucial to prevent unwanted side effects (like image drag)
          }
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        };

        // Callback to stop the drag operation
        const handleMouseUp = useCallback(() => {
          draggingHandleRef.current = null;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }, [handleMouseMove]);

        const handleTimelineZoomCloseButtonClick = () => {
          setShowTimelineZoom(false);
        }

        const handleDragMouseDown = (e) => {
          setIsDragging(true);
          offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
          };
        };

        useEffect(() => {
          const handleDragMouseMove = (e) => {
            if (!isDragging) return;

            const newX = e.clientX - offset.current.x;
            const newY = e.clientY - offset.current.y;
            
            setPosition({ x: newX, y: newY });
          };

          const handleDragMouseUp = () => {
            setIsDragging(false);
          };

          if (isDragging) {
            // Attach to window so fast movements don't break the drag
            window.addEventListener('mousemove', handleDragMouseMove);
            window.addEventListener('mouseup', handleDragMouseUp);
          }

          return () => {
            window.removeEventListener('mousemove', handleDragMouseMove);
            window.removeEventListener('mouseup', handleDragMouseUp);
          };
        }, [isDragging, position.x, position.y]);

        return (
        <>
          <div
            id="zoomControl"
            onDragStart={(e) => e.preventDefault()}
            style={{
              fontFamily: '"OPTICopperplate-Light", sans-serif',
              position: "fixed",
              top: `calc(50% + ${position.y}px)`,
              left: `calc(50% + ${position.x}px)`,
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.95)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "5px",
              fontSize: "1rem",
              textAlign: "center",
              zIndex: 9999,
              touchAction: "none"
            }}
          >
            <div
              onMouseDown={handleDragMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                cursor: 'grab',
                borderRadius: '5px 5px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Simple visual indicator for the drag handle */}
              <div style={{ width: '30px', height: '2px', backgroundColor: '#6d6d6dff' }}></div>
            </div>
            <CloseButton 
              aria-label='Hide'
              variant= 'white'
              style = {{
                zIndex: 200,
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '1rem'
                }}
              onClick = {handleTimelineZoomCloseButtonClick}
              />
              <div className="video-trimmer-container mt-5">
                <div className="d-flex flex-column align-items-center mb-4">
                  <div className="d-flex align-items-center gap-3" style={{ width: '300px' }}>
                    <i className="fa-solid fa-magnifying-glass-minus text-white"></i>
                    <input
                        type="range"
                        className="form-range custom-zoom-slider"
                        min="1"
                        max="10"
                        step="0.1"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                        // PREVENT PARENT INTERFERENCE:
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', touchAction: 'none' }} // touchAction: 'none' helps mobile sliding
                      />
                    <i className="fa-solid fa-magnifying-glass-plus text-white"></i>
                  </div>
                  <small className="text-white-50 mt-1">Zoom: {zoomLevel.toFixed(1)}x</small>
                </div>

                <div className="mx-auto mb-3">
                  <span className="time-label-zoom-start">
                        {formatTime(clipStart)}
                  </span>
                  <span className="time-label-zoom-end">
                        {formatTime(clipEnd)}
                </span>
                </div>

                {/* Viewport: This stays fixed width, content inside expands */}
                <div className="timeline-viewport" style={{ overflowX: 'auto', width: '100%', padding: '20px 0' }}>
                  <div
                    className="timeline-track"
                    ref={timelineRef}
                    style={{
                      width: `${100 * zoomLevel}%`, // Expands based on zoom
                      position: 'relative',
                      height: '40px',
                      backgroundColor: '#333',
                      transition: 'width 0.2s ease-out',
                    }}
                  >
                    <div
                      className="trimmer-handle left-handle"
                      style={{ left: `${(clipStart / duration) * 100}%`, zIndex: getHandleZIndex('start') }}
                      onMouseDown={(e) => handleMouseDown('start', e)}
                    >
                      <div className="handle-grip"></div>
                    </div>

                    <div
                      className="selected-range"
                      style={getSelectedRangeStyle()}
                      onMouseDown={(e) => handleMouseDown('middle', e)}
                    ></div>

                    <div
                      className="trimmer-handle right-handle"
                      style={{ left: `${(clipEnd / duration) * 100}%`, zIndex: getHandleZIndex('end') }}
                      onMouseDown={(e) => handleMouseDown('end', e)}
                    >
                      <div className="handle-grip"></div>
                    </div>
                  </div>
                </div> 
              </div>
          </div>
        </>
      )
    }

    function TrimmerHandler({ handleRecognizeFile }) {
      const MIN_CLIP_DURATION = 1; 
      const MAX_CLIP_DURATION = config.maxDuration;
      const initialClipEnd = Math.min(MAX_CLIP_DURATION, duration);
      const [clipStart, setClipStart] = useState(0); 
      const [clipEnd, setClipEnd] = useState(initialClipEnd);
      const timelineRef = useRef(null);
      const [activeHandle, setActiveHandle] = useState(1); // 0: start handle, 1: end handle
      const [isEditingStart, setIsEditingStart] = useState(false);
      const [isEditingEnd, setIsEditingEnd] = useState(false);
      const [rawClipStartInput, setRawClipStartInput] = useState("");
      const [rawClipEndInput, setRawClipEndInput] = useState("");
      const [passStartTimeRegexCheck, setPassStartTimeRegexCheck] = useState(true);
      const [passEndTimeRegexCheck, setPassEndTimeRegexCheck] = useState(true);
      const [showTimelineZoom, setShowTimelineZoom] = useState(false);
      
      // Refs for Dragging/Panning
      const draggingHandleRef = useRef(null); // 'start', 'end', or 'middle'
      const startDragTimeRef = useRef(0);    // Stores { clipStart, clipEnd } when pan starts
      const startMouseXRef = useRef(0);     // Mouse X position when the drag/pan starts
      
      const timeCheckRegex = /^([0-9]{0,5}|[0-9]{0,4}:[0-9]{0,2})$/;

      useEffect (() => {
        if(! showMediaTrimmer) {
          setShowTimelineZoom(false);
        }
      }, [showMediaTrimmer])

      const confirmMediaTrim = () => {
        const clipDuration = clipEnd - clipStart;
        setShowMediaTrimmer(false);
        handleRecognizeFile(clipStart, clipDuration);
      };

      const getHandleZIndex = (handleType) => {
        const startPercent = (clipStart / duration) * 100;

        // Base Z-index levels
        const ACTIVE_Z = 100; // Always highest when dragging
        const BACK_Z = 20;    // Lower Z-index for the handle that is behind

        // Prevent deadlock
        if (startPercent > 95.0 && handleType === 'start') {
          return ACTIVE_Z;
        }
        if (startPercent > 95.0 && handleType === 'end') {
          return BACK_Z;
        }

        // When dragging
        if (activeHandle === 0 && handleType === 'start') {
          return ACTIVE_Z; 
        }
        if (activeHandle === 1 && handleType === 'end') {
          return ACTIVE_Z;
        }

        // The handle behind
        if (handleType === 'start') {
          return BACK_Z; 
        }
        if (handleType === 'end') {
          return BACK_Z;
        }
        // Fallback
        return BACK_Z;
      };
      
      const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
      };

      // Check if a time string is valid and convert time string to seconds
      const parseTime = (timeString) => {
        const cleanedString = timeString.trim();
        
        if (cleanedString.includes(':')) {
          const parts = cleanedString.split(':');
          
          // mm:ss
          if (parts.length !== 2) return null;

          let [minStr, secStr] = parts;
          // Handle "mm:" -> default seconds to 0
          // Handle ":ss" -> default minutes to 0
          let minutes = minStr === "" ? 0 : parseInt(minStr, 10);
          let seconds = secStr === "" ? 0 : parseInt(secStr, 10);

          // Validation: Ensure both parts are actually numbers (or were empty)
          if (isNaN(minutes) || isNaN(seconds)) return null;

          // Optional: Over-limit seconds logic (e.g., 1:90 becomes 2:30)
          if (seconds > 59) {
            minutes += Math.floor(seconds / 60);
            seconds = seconds % 60;
          }

          return (minutes * 60) + seconds;
        } 
        else {
          // Handle pure numbers
          if (!/^\d+$/.test(cleanedString)) return null;
          const totalSeconds = parseInt(cleanedString, 10);
          return (isNaN(totalSeconds) || totalSeconds < 0) ? null : totalSeconds;
        }
      };

      // Time label edit
      const handleTimeInputChange = (e, method) => {
        if(method == 0) {
          if (! timeCheckRegex.test(e.target.value)) {
            setPassStartTimeRegexCheck(false);
            return;
          }
          setPassStartTimeRegexCheck(true);
          setRawClipStartInput(e.target.value)
        }
        else if(method == 1) {
          if (! timeCheckRegex.test(e.target.value)) {
            setPassEndTimeRegexCheck(false);
            return;
          }
          setPassEndTimeRegexCheck(true);
          setRawClipEndInput(e.target.value);
        }
      };

      // Set clip start & end time when the user finishes editing time labels
      const handleTimeInputConfirm = (e, method) => {
        setPassEndTimeRegexCheck(true);
        let time = parseTime(e.target.value);
        if (time != null) {
          if(method == 0) {
            setActiveHandle(0);
            setIsEditingStart(false);
            if(time <= duration - MIN_CLIP_DURATION) {
              if (time <= clipEnd - MIN_CLIP_DURATION) {
                if(clipEnd - time <= MAX_CLIP_DURATION) {
                  setClipStart(time);
                }
                else {
                  setClipEnd(time + MAX_CLIP_DURATION);
                  setClipStart(time);
                }
              }
              else {
                setClipEnd(time + MIN_CLIP_DURATION);
                setClipStart(time);
              }
            }
            else {
              setClipEnd(duration);
              setClipStart(duration - MIN_CLIP_DURATION);
            }
          }
          else if (method == 1) {
            setActiveHandle(1);
            setIsEditingEnd(false);
            if(time > duration) {
              setClipEnd(duration);
              setClipStart(duration - MAX_CLIP_DURATION);
            } else
            if(time >= MIN_CLIP_DURATION) {
              if(time >= clipStart + MIN_CLIP_DURATION) {
                if (time - clipStart > MAX_CLIP_DURATION) {
                  setClipStart(time - MAX_CLIP_DURATION);
                  setClipEnd(time);
                }
                else {
                  setClipEnd(time);
                }
              }
              else {
                setClipStart(time - MIN_CLIP_DURATION);
                setClipEnd(time)
              }
            }
            else {
              setClipStart(0);
              setClipEnd(MIN_CLIP_DURATION);
            }
          }
        } else {
          setRawClipStartInput(formatTime(clipStart));
        }
        setRawClipStartInput(formatTime(clipStart));
        setRawClipEndInput(formatTime(clipEnd));
      };

      // Reset error status when the user finishes editing time labels.
      useEffect(() => {
        setPassEndTimeRegexCheck(true);
        setRawClipStartInput(formatTime(clipStart));
      }, [clipStart]);

      useEffect(() => {
        setPassEndTimeRegexCheck(true);
        setRawClipEndInput(formatTime(clipEnd));
      }, [clipEnd]);


      const getSelectedRangeStyle = () => {
        const startPercent = (clipStart / duration) * 100;
        const endPercent = (clipEnd / duration) * 100;
        const widthPercent = endPercent - startPercent;
        return {
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
        };
      };

      // Timeline dragging
      const handleMouseMove = useCallback((e) => {
        if (!draggingHandleRef.current || !timelineRef.current) return;
        const trackBounds = timelineRef.current.getBoundingClientRect();
        const trackWidth = trackBounds.width;
        const handleType = draggingHandleRef.current;

        // Panning the Entire Bar (Middle Drag)
        if (handleType === 'middle') {
          const mouseDeltaX = e.clientX - startMouseXRef.current;
          // Convert pixel delta to time delta
          const timeDelta = (mouseDeltaX / trackWidth) * duration;
          let newStart = startDragTimeRef.current.clipStart + timeDelta;
          let newEnd = startDragTimeRef.current.clipEnd + timeDelta;
          // Clamp Panning: Ensure the bar stays within the total duration (0 to duration)
          if (newStart < 0) {
            const offset = 0 - newStart; 
            newStart += offset;
            newEnd += offset;
          }
          if (newEnd > duration) {
            const offset = newEnd - duration;
            newStart -= offset;
            newEnd -= offset;
          }
          setClipStart(newStart);
          setClipEnd(newEnd);
          return; // Stop here for pan logic
        }

        // Start/End Drag
        const newPixelPosition = e.clientX - trackBounds.left;
        let newTime = (newPixelPosition / trackWidth) * duration;
        newTime = Math.max(0, Math.min(duration, newTime)); // Total track clamping
        if (handleType === 'start') {
          setActiveHandle(0); 
          const maxStart = clipEnd - MIN_CLIP_DURATION;
          newTime = Math.min(newTime, maxStart);
          //Max Duration Scrubbing
          const currentDuration = clipEnd - newTime;
          if (currentDuration > MAX_CLIP_DURATION) {
            const durationExceededBy = currentDuration - MAX_CLIP_DURATION;
            const newClipEnd = clipEnd - durationExceededBy;
            const finalClipEnd = Math.min(duration, newClipEnd);
              
            // Update both handles
            setClipStart(newTime); // newTime is already track-clamped
            setClipEnd(finalClipEnd);

          } else {
            // If within max duration limit, just update the start handle
            setClipStart(newTime);
            if (clipEnd - newTime <= MIN_CLIP_DURATION) {
              setClipEnd(newTime + MIN_CLIP_DURATION);
            }
          }
        } else if (handleType === 'end') {
          setActiveHandle(1);
          const minEnd = clipStart + MIN_CLIP_DURATION;
          newTime = Math.max(newTime, minEnd);
          // Max Duration Scrubbing
          const currentDuration = newTime - clipStart;
          if (currentDuration > MAX_CLIP_DURATION) {
            const durationExceededBy = currentDuration - MAX_CLIP_DURATION;
            const newClipStart = clipStart + durationExceededBy;
            // Ensure the new clipStart doesn't violate track boundaries (>= 0)
            const finalClipStart = Math.max(0, newClipStart);
              
            // Update both handles
            setClipStart(finalClipStart);
            setClipEnd(newTime); // newTime is already track-clamped

          } else {
            // If within max duration limit, just update the end handle
            setClipEnd(newTime);
            if (newTime - clipStart <= MIN_CLIP_DURATION) {
              setClipStart(newTime - MIN_CLIP_DURATION);
            }
          }
        }
      }, [clipStart, clipEnd, duration]);

      // Clamping to ensure that clipStart is always before clipEnd
      useEffect(() => {
        // Ensure clipStart is always >= 0
        const clampedClipStart = Math.max(0, clipStart);

        // Ensure clipEnd is always <= the duration
        const clampedClipEnd = Math.min(duration, clipEnd);

        // Ensure clipStart is always less than clipEnd
        const validClipStart = Math.min(clampedClipStart, clampedClipEnd);
        const validClipEnd = Math.max(clampedClipStart, clampedClipEnd);

        // Apply the final clamped values back to the state
        if (validClipStart !== clipStart) {
          setClipStart(validClipStart);
        }
        if (validClipEnd !== clipEnd) {
          setClipEnd(validClipEnd);
        }
      }, [clipStart, clipEnd, duration]);

      // Media seeking when the start handle is dragged or panning
      useEffect(() => {
        const video = videoRef.current;
        if (video && video.readyState >= 1 && activeHandle != 1) {
          video.currentTime = clipStart;
        }
      }, [clipStart, activeHandle]);
    
      // Media seeking when the end handle is dragged
      useEffect(() => {
        const video = videoRef.current;
        if (video && video.readyState >= 1 && activeHandle === 1) {
          video.currentTime = clipEnd;
        }
      }, [clipEnd, activeHandle]);

      // Limit the playback to the selected part
      useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
          if (video.currentTime <= clipStart - 0.001) {
            video.pause();
            video.currentTime = clipStart;
          }
          if (video.currentTime >= clipEnd + 0.001) {
            if (! video.paused) {
              video.currentTime = clipStart;
              video.play();
            } else {
              video.pause();
              video.currentTime = clipStart;
            }
          }
        };

        const handleVideoEnded = () => {
          video.play();
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleVideoEnded);

        return () => {
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('ended', handleVideoEnded);
        };
      }, [clipStart, clipEnd, videoRef]);

      // Callback to start the drag operation
      const handleMouseDown = (handleType, e) => {
        // Indicate which handle is being dragged
        draggingHandleRef.current = handleType;
        if (handleType === 'middle') {
          // Store the initial state for the panning calculation
          startDragTimeRef.current = { clipStart, clipEnd };
          startMouseXRef.current = e.clientX;
          e.preventDefault(); // Crucial to prevent unwanted side effects (like image drag)
        }
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      };

      // Callback to stop the drag operation
      const handleMouseUp = useCallback(() => {
        draggingHandleRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }, [handleMouseMove]);

      const handleTimelineZoom = () => {
        setShowTimelineZoom(true);
      };

      return (
      <>
        {showTimelineZoom && (
          <TimelineZoom
            setShowTimelineZoom = {setShowTimelineZoom}
            clipStart = {clipStart}
            setClipStart = {setClipStart}
            clipEnd = {clipEnd}
            setClipEnd = {setClipEnd}
          />
        )}
        <div className="video-trimmer-container mt-5">
          <button
            id="zoomBtn"
            className="mx-auto btn btn-primary mb-3"
            style={{"backgroundColor": "#212529", "color":"#f8f9fa", padding: "0.5rem 1rem"}}
            onClick={handleTimelineZoom}
            >
              Zoom <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          <div className="timeline-track" ref={timelineRef}>
            <div 
              className="trimmer-handle left-handle"
              style={{ left: `${(clipStart / duration) * 100}%`, zIndex: getHandleZIndex('start')}}
              onMouseDown={(e) => {e.stopPropagation(); handleMouseDown('start', e)}} // Pass event to handleMouseDown
            >
              <div className="handle-grip"></div>
              { isEditingStart ? (
                <input 
                  type="text"
                  className= { passStartTimeRegexCheck ? ("time-label-edit-start") : ("time-label-edit-start-error")} 
                  value={rawClipStartInput}
                  onChange={(e) => handleTimeInputChange(e, 0)}
                  onBlur={(e) => handleTimeInputConfirm(e, 0)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span className="time-label" onClick={() => setIsEditingStart(true)}>{formatTime(clipStart)}</span>
              )}
            </div>
            <div 
              className="selected-range" 
              style={getSelectedRangeStyle()} 
              onMouseDown={(e) => handleMouseDown('middle', e)} // <-- NEW Panning Handler
            >
            </div>
            <div 
              className="trimmer-handle right-handle"
              style={{ left: `${(clipEnd / duration) * 100}%`, zIndex: getHandleZIndex('end')}}
              onMouseDown={(e) => {e.stopPropagation(); handleMouseDown('end', e)}} // Pass event to handleMouseDown
            >
              <div className="handle-grip"></div>
              { isEditingEnd ? (
                <input
                  type="text"
                  className= { passEndTimeRegexCheck ? ("time-label-edit-end") : ("time-label-edit-end-error")} 
                  value={rawClipEndInput}
                  onChange={(e) => handleTimeInputChange(e, 1)}
                  onBlur={(e) => handleTimeInputConfirm(e, 1)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span className="time-label" onClick={() => setIsEditingEnd(true)}>{formatTime(clipEnd)}</span>
              )}
            </div>
          </div>
          <div className="duration-info">
            Selected: {formatTime(clipEnd - clipStart)} / Total: {formatTime(duration)}
          </div>
        </div>
        <button
          id="uploadBtn"
          className="mx-auto btn btn-primary mt-2 mb-2"
          style={{"backgroundColor": "#f8f9fa", "color":"#000000ff"}}
          onClick={confirmMediaTrim}
          >
            Recognize <i className="fas fa-record-vinyl"></i>
        </button>
      </>
      );
      }

    return (
      <div
        id="mediaTrimmer"
        style={{
          fontFamily: '"OPTICopperplate-Light", sans-serif',
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(0,0,0,0.9)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "5px",
          fontSize: "1rem",
          textAlign: "center",
          zIndex: 9999
        }}
      >
        <CloseButton 
          aria-label='Hide'
          variant= 'white'
          style = {{
            zIndex: 200,
            position: 'absolute',
            top: '8px',
            right: '8px',
          }}
          onClick = {handleCloseButtonClick}
        />
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <h2 style={{  fontSize: "1.2rem", userSelect: "none" }} className="mt-1" >Select Time Range</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <video
            ref={videoRef}
            src={URL.createObjectURL(selectedFile)}
            controls
            className="mt-2"
            style= {{
              maxWidth: '100%',
              maxHeight: isAudioOnly ? '60px' : '480px',
            }} // Max size, responsive
            onLoadedMetadata={handleLoadedMetadata}
          />
        </div>
        <TrimmerHandler
          handleRecognizeFile = {handleRecognizeFile}
        />
      </div>
    )}

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setShowMediaTrimmer(true);
      setDisabled(true);
    } else {
      setSelectedFile(null);
      setFileName(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRecognizeFile = async (startTimeStamp, trimmedDuration) => {
    if (!selectedFile)
    {
      setIsError(true);
      setIsWarning(false);
      setErrorMsg('Error: No file selected');
    }
    else {
      try {
        setDisabled(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('start', startTimeStamp);
        formData.append('duration', trimmedDuration);
        const url = `${config.apiBaseUrl.replace(/\/$/, '')}/api/recognize`;
        const response = await uploadtoAPI(url, formData);
        if (response) {
          const resultToken = JSON.parse(response).token;
          if (resultToken !== undefined && resultToken !== null) {
            router.push(`/results/${resultToken}`);
          }
          else {
            setIsError(false);
            setIsWarning(true);
            setSelectedFile(null);
            setFileName(null);
            setTitle(`${config.appName} - ${config.title}`);
            setWarnMsg('Warning: No results were found');
          }
        }
      }
      catch (error) {
        setTitle(`${config.appName} - ${config.title}`);
        setIsError(true);
        setIsWarning(false);
        setErrorMsg(error.toString());
        setSelectedFile(null);
        setFileName(null);
      }
      finally {
        setDisabled(false);
      }
    };
  };

  return (
    <>
      {showMediaTrimmer && (
        <MediaTrimmer />
      )}
      <span>
        <input ref={fileInputRef}
          id="fileInput"
          type="file"
          style={{ display: 'none' }}
          accept="audio/*,video/*"
          onChange={handleFileChange}
        />

        <button
          id="selectFileBtn"
          className="mx-auto btn btn-primary mt-2 mb-2"
          style={{"backgroundColor": "#212529"}}
          disabled={disabled}
          onClick={handleButtonClick}
          >
            Select <i className="fas fa-file-audio"></i> <i className="fas fa-file-video"></i>
        </button>
          
        {fileName ? (
          <div style={{color: '#c8c8c8ff', fontFamily: '"OPTICopperplate-Light", sans-serif'}}>
            <strong>Selected file:</strong> {fileName}
          </div>
        ) : (
          <div style={{color: '#c8c8c8ff', fontFamily: '"OPTICopperplate-Light", sans-serif'}}>
            <strong><br/></strong>
          </div>
        )}
      </span>
    </>
  )
}