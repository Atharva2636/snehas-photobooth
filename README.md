# Real-Time Collaborative Photobooth

## Overview
A high-performance, real-time collaborative virtual photobooth web application. This project enables remote users to connect via WebRTC peer-to-peer channels, synchronize live video streams, capture coordinated multi-angle snapshots, and render customized composite photobooth strips with intelligent layout templates and visual filters. Developed as part of the AICTE - IBM SkillsBuild Internship.

## Features
* **Peer-to-Peer Room Management:** Dynamic room creation and instant URL-based guest onboarding with persistent host session recovery.
* **Live Stream Synchronization:** Real-time low-latency video feed pairing and preview powered by WebRTC peer connections.
* **Automated Capture & Composition:** Automated multi-frame capture sequence with client-side canvas rendering for template alignment and filter processing.
* **Smart Asset Exporting:** Automated strip rendering, high-resolution downloads, and instant session resets with hardware stream cleanup.

## Tech Stack
* **Frontend:** React 18, TypeScript
* **Build Tool:** Vite
* **Communication:** WebRTC (Peer-to-Peer Data & Media Streams)
* **Styling:** Tailwind CSS
* **UI Components:** Lucide Icons, Sonner Notifications
* **Media Processing:** HTML5 Canvas API & MediaStream Recording

## Getting Started

### Prerequisites
* Node.js (v16 or higher recommended)
* npm or pnpm

### Installation
1. Extract the project ZIP file.
2. Open a terminal in the project directory.
3. Install the required dependencies:
   ```bash
   npm install
  
