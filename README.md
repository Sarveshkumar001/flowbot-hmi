# 🤖 FlowBot HMI — Factory-Net v2.0

> **A Cyber-Industrial Human-Machine Interface for Visual Robot Programming**
> Built with React, ReactFlow, and Tailwind CSS. Designed for ROS 2 integration.

![FlowBot HMI](https://img.shields.io/badge/version-0.1.0-cyan?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![ReactFlow](https://img.shields.io/badge/ReactFlow-11-purple?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal?style=for-the-badge&logo=tailwindcss)
![ROS2](https://img.shields.io/badge/ROS_2-Ready-orange?style=for-the-badge)

---

## 📋 Overview

**FlowBot HMI** is a browser-based, visual workflow programming interface designed for industrial robot operators. It allows users to build, simulate, and export multi-step robot routines using a drag-and-drop node graph — with no code required.

The interface is built around a **Cyber-Industrial aesthetic** featuring:
- Deep navy glassmorphic panels
- Electric cyan / neon amber / rose-red accent system
- Segmented neon status bars and animated energy-pulse connections
- JetBrains Mono monospace typography for a high-tech readability

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧩 **Drag-and-Drop Node Graph** | Build robot routines visually using ReactFlow |
| 🤖 **Robot Fleet Overview** | Monitor up to N robots with live status badges and segmented battery bars |
| ▶ **Workflow Simulation** | Step-through simulation with active node highlighting and telemetry logging |
| 📡 **Active Alerts Panel** | Real-time critical/warning alert banner with pulse animation |
| 🗂️ **Historical Fault Log** | Scrollable table of past fault events with severity-coded error codes |
| ⬇ **ROS 2 Export** | One-click export of current workflow as a structured `ros2_workflow.json` |
| ✨ **AI Co-Pilot** | Natural language workflow generator (Claude API powered) |
| ↔ **Forward / Backward Nav** | Step-wise navigation through workflow nodes |

---

## 🏗️ Architecture

```
robot-hmi/
├── public/
├── src/
│   ├── App.js               ← Main HMI layout, state management, simulation logic
│   ├── index.css            ← Global Cyber-Industrial theme (grid, glows, animations)
│   ├── index.js             ← React entry point
│   ├── simulate.js          ← Workflow simulation engine (node traversal)
│   └── nodes/
│       ├── StartNode.jsx    ← Hyper-Lime gradient card  (workflow trigger)
│       ├── MoveToNode.jsx   ← Electric Cyan card        (waypoint navigation)
│       ├── PickObjectNode.jsx ← Violet card             (gripper pick)
│       ├── DropObjectNode.jsx ← Orange card             (gripper release)
│       ├── CheckSensorNode.jsx ← Neon Amber card        (sensor validation gate)
│       └── EndNode.jsx      ← Slate card                (workflow termination)
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🖥️ UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (64px) — Logo | BWD | FWD | RESET | ▶ SIMULATE | EXPORT │
├──────────────┬──────────────────────────┬───────────────────────┤
│ LEFT (320px) │   CENTER CANVAS (flex-1) │   RIGHT (340px)       │
│              │                          │                       │
│ Fleet        │   ReactFlow              │  ⚠ Active Alert       │
│ Overview     │   Node Graph             │  System Status        │
│ (scrollable) │   (drag & drop)          │  Telemetry Log        │
│              │   Energy-pulse edges     │  (scrollable)         │
│ Node Library │   Glassmorphic nodes     │  Fault History        │
│ (drag source)│                          │  (max-h table)        │
└──────────────┴──────────────────────────┴───────────────────────┘
                                              ✨ AI Co-Pilot (FAB)
```

---

## 🤖 Node Types

| Node | Color | Purpose |
|---|---|---|
| **Start** | 🟢 Hyper-Lime `#a3e635` | Triggers the workflow (manual or scheduled) |
| **Move To** | 🔵 Electric Cyan `#00f0ff` | Navigates robot to a waypoint coordinate |
| **Pick Object** | 🟣 Violet `#8b5cf6` | Activates gripper to pick a target object |
| **Drop Object** | 🟠 Orange `#f97316` | Releases gripper payload at a drop zone |
| **Check Sensor** | 🟡 Neon Amber `#fbbf24` | Reads a sensor and gates the next step |
| **End** | ⚫ Slate `#94a3b8` | Terminates the workflow execution |

---

## 🔬 Sensor Integration (`CheckSensorNode`)

The **Check Sensor** node is a generic sensor validation gate. In the simulation it acts as a pass-through; in a real ROS 2 deployment it maps to a specific sensor topic:

| Sensor Type | ROS 2 Topic Example | Use Case |
|---|---|---|
| LiDAR / Ultrasonic | `/scan` | Obstacle detection |
| Force / Torque | `/joint_states` | Gripper load validation |
| Proximity (IR) | `/proximity/zone_4` | Zone entry detection |
| Vision (Camera) | `/camera/detections` | Object presence check |
| Photoelectric | `/conveyor/beam` | Conveyor presence sensing |

The exported `ros2_workflow.json` includes all node metadata — you map the sensor node to your specific topic in the ROS 2 bridge layer.

---

## 🤖 Robot Fleet Status Badges

| Status | Color | Behavior |
|---|---|---|
| **Running** | ⚡ Electric Cyan | Pulsing glow animation on the active unit |
| **Idle** | 🔘 Slate | Static, no animation |
| **E-Stop** | 🔴 Rose Red | Blinking + `AlertTriangle` icon |
| **Charging** | 🟡 Neon Amber | `Zap` bolt icon |

Battery levels use a **10-segment neon bar** that shifts color:
- `> 60%` → Cyan glow
- `25–60%` → Amber glow
- `< 25%` → Rose-Red glow

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd robot-hmi

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at **http://localhost:3000**

### Build for Production

```bash
npm run build
```

---

## ⬇ ROS 2 Export Format

Clicking **EXPORT ROS2** downloads a `ros2_workflow.json` with this structure:

```json
{
  "name": "Warehouse Pick & Place Workflow",
  "generated_by": "FlowBot HMI",
  "ros2_package": "robot_workflows",
  "nodes": [
    { "id": "1", "type": "startNode",  "label": "Trigger: Manual",    "position": { "x": 200, "y": 40  } },
    { "id": "2", "type": "moveToNode", "label": "Waypoint A — Shelf 3","position": { "x": 200, "y": 140 } }
  ],
  "edges": [
    { "from": "1", "to": "2" }
  ]
}
```

---

## ✨ AI Co-Pilot

Click the **✨ button** (bottom-right) to open the natural language workflow generator.

**Example prompts:**
```
"Pick a box from shelf 3, check for obstacles, then drop at station B"
"Move to waypoint A, pick the item, move to drop zone, release"
```

The AI (Claude API) responds with a structured JSON workflow that is immediately loaded into the canvas.

> ⚠️ Requires a valid Anthropic API key configured in the fetch request inside `sendMessage()` in `App.js`.

---

## 🛠️ Tech Stack

| Technology | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| ReactFlow | 11.11 | Node graph engine |
| Tailwind CSS | 3.4 | Utility-first styling |
| Lucide React | 1.8 | Icon set |
| JetBrains Mono | — | Monospace typography (Google Fonts) |
| Inter | — | UI typography (Google Fonts) |
| Claude API | Sonnet | AI workflow generation |

---

## 📌 Known Limitations & Next Steps

| Item | Status | Notes |
|---|---|---|
| Navigation (BWD/FWD) | 🟡 Placeholder | `handleNavigation()` logs to console only |
| Fleet data | 🟡 Mock | `robotFleet` is a static array — needs WebSocket/ROS bridge |
| Alert data | 🟡 Mock | `currentAlert` and `faultHistory` are hardcoded |
| Sensor node logic | 🟡 Simulation | Always passes — needs real topic subscription |
| AI API key | ⚠️ Required | Must be set in `sendMessage()` for Co-Pilot to work |
| ROS 2 bridge | 🔲 Planned | `rosbridge_suite` / `roslibjs` integration |

---

## 📄 License

This project is a prototype developed for research and demonstration purposes.

---

*FlowBot HMI — Factory-Net v2.0 · Built with ❤️ using React + ReactFlow*
