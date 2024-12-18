import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./Grid.css";

// Replace with your ngrok URL
const socket = io("https://d6d5-2409-40c1-2a-9b7b-980b-48f2-fd3f-f060.ngrok-free.app", {
  transports: ["websocket"], // Force WebSocket transport
});

const Grid = () => {
  const [grid, setGrid] = useState(
    Array(10)
      .fill(null)
      .map(() => Array(10).fill(""))
  );
  const [playerCount, setPlayerCount] = useState(0);
  const [canUpdate, setCanUpdate] = useState(true);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [history, setHistory] = useState([]);
  const [showingHistory, setShowingHistory] = useState(false);

  useEffect(() => {
    // Setup socket event listeners
    socket.on("grid-update", (updatedGrid) => {
      console.log("Grid updated:", updatedGrid);
      setGrid(updatedGrid);
    });

    socket.on("player-count", (count) => {
      console.log("Player count received on frontend:", count);
      setPlayerCount(count);
    });

    socket.on("grid-history", (updateHistory) => {
      console.log("History received:", updateHistory);
      setHistory(updateHistory);
    });

    socket.on("grouped-updates", (groupedBatch) => {
      console.log("Grouped Updates:", groupedBatch);
    });

    // Handle connection and disconnection logs
    socket.on("connect", () => console.log("Connected to server:", socket.id));
    socket.on("disconnect", () => console.warn("Disconnected from server"));

    // Cleanup event listeners on unmount
    return () => {
      socket.off("grid-update");
      socket.off("player-count");
      socket.off("grid-history");
      socket.off("grouped-updates");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []); // Empty dependency array ensures this runs only once

  const handleBlockClick = (row, col) => {
    if (!canUpdate || hasUpdated || grid[row][col]) return;

    const unicodeChar = prompt("Enter a Unicode character:");
    if (!unicodeChar || unicodeChar.length !== 1) {
      alert("Please enter a valid single Unicode character.");
      return;
    }

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((rowArr, rowIndex) =>
        rowArr.map((cell, colIndex) =>
          rowIndex === row && colIndex === col ? unicodeChar : cell
        )
      );
      return newGrid;
    });

    socket.emit("update-grid", { row, col, char: unicodeChar });

    setHasUpdated(true);
  };

  const toggleHistory = () => {
    setShowingHistory(!showingHistory);
  };

  const revertToState = (historyIndex) => {
    const revertedGrid = history
      .slice(0, historyIndex + 1)
      .reduce(
        (grid, update) => {
          grid[update.row][update.col] = update.char;
          return grid;
        },
        Array(10)
          .fill(null)
          .map(() => Array(10).fill(""))
      );
    setGrid(revertedGrid);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  return (
    <div className="container">
      <h1 className="title">Multiplayer Grid</h1>
      <h3 className="player-count">Players Online: {playerCount}</h3>
      <button className="toggle-button" onClick={toggleHistory}>
        {showingHistory ? "Hide History" : "Show History"}
      </button>
      {showingHistory && (
        <div className="history">
          <h4>Update History:</h4>
          <ul>
            {history.map((update, index) => (
              <li
                key={index}
                className="history-item"
                onClick={() => revertToState(index)}
              >
                <span>
                  <strong>Row:</strong> {update.row}, <strong>Col:</strong> {update.col}
                </span>
                <span>
                  <strong>Char:</strong> {update.char}
                </span>
                <span>
                  <strong>Time:</strong> {formatTimestamp(update.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((block, colIndex) => (
              <div
                key={colIndex}
                className={`grid-block ${block ? "filled" : ""}`}
                onClick={() => handleBlockClick(rowIndex, colIndex)}
              >
                {block}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grid;
