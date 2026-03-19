import React from "react";
import "../styles/SummaryPage.css";

function SummaryPage() {

  const transcript = [
    {speaker:"Speaker 1", text:"Hello everyone, welcome to today's meeting."},
    {speaker:"Speaker 2", text:"Today we will discuss the development progress."},
    {speaker:"Speaker 3", text:"Frontend UI is almost completed."},
    {speaker:"Speaker 1", text:"Backend integration will start next week."}
  ];

  const keyPoints=[
    "Project progress reviewed",
    "Frontend UI near completion",
    "Backend integration planning"
  ];

  const actions=[
    "Finish UI components",
    "Start backend API integration",
    "Prepare prototype demo"
  ];

  const decisions=[
    "Prototype launch planned for next week"
  ];

  return(

    <div className="summary-page">

      {/* decorative gradient shapes */}
      <div className="blob blob-a"></div>
      <div className="blob blob-b"></div>
      <div className="blob blob-c"></div>

      {/* HERO */}

      <div className="hero">

        <div className="hero-left">

          <h1>MeetPilot AI</h1>

          <p>
            AI powered meeting intelligence that transforms conversations
            into summaries, insights and decisions instantly.
          </p>

        </div>

        <div className="hero-right">
          🤖
        </div>

      </div>


      {/* AI SUMMARY */}

      <div className="ai-summary glass">

        <h2>✨ AI Generated Meeting Insight</h2>

        <p>
          The team reviewed project progress and confirmed that the
          frontend interface is nearing completion. Backend integration
          will begin next week, and a working prototype is planned for
          demonstration.
        </p>

      </div>


      {/* INSIGHT GRID */}

      <div className="insight-grid">

        <div className="insight glass purple">

          <h3> Key Points</h3>

          <ul>
            {keyPoints.map((i,index)=>(
              <li key={index}>{i}</li>
            ))}
          </ul>

        </div>


        <div className="insight glass blue">

          <h3> Action Items</h3>

          <ul>
            {actions.map((i,index)=>(
              <li key={index}>{i}</li>
            ))}
          </ul>

        </div>


        <div className="insight glass pink">

          <h3> Decisions</h3>

          <ul>
            {decisions.map((i,index)=>(
              <li key={index}>{i}</li>
            ))}
          </ul>

        </div>

      </div>


      {/* TRANSCRIPT */}

      <div className="transcript glass">

        <h2> Meeting Transcript</h2>

        {transcript.map((line,index)=>(
          <div className="chat-line" key={index}>

            <div className="speaker">
              {line.speaker}
            </div>

            <div className="bubble">
              {line.text}
            </div>

          </div>
        ))}

      </div>


      {/* BUTTONS */}

      <div className="buttons">

        <button className="primary-btn">
          Copy Summary
        </button>

        <button className="secondary-btn">
          Download Notes
        </button>

      </div>

    </div>
  )

}

export default SummaryPage;