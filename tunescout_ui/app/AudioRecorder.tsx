import { useRef, useState } from "react";
import { useRouter } from 'next/navigation';

export default function AudioRecorder ({ disabled, uploadtoAPI, setDisabled, setErrorMsg, setisError }) {
  return (
  <button 
    id="recordBtn"
    className="mx-auto btn btn-primary mt-2 mb-5"
    disabled={disabled}
    style={{"backgroundColor": "red"}}
    >
      Record
      <i className="fas fa-microphone"></i>
  </button>
  )
}