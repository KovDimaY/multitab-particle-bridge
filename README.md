# Multitab Particle Bridge

This project is a real-time, multi-tab synchronized 3D particle visualization built with React, TypeScript, and React Three Fiber. Inspired by an Instagram video I saw, the goal was to recreate the illusion that browser tabs exist in the same shared 3D space — where spheres represent each tab, and bridges of glowing particles flow between them.

Here you can see the video that inspired this project: [https://youtu.be/4LwHH3r2qNY](https://youtu.be/4LwHH3r2qNY)

👉 Live Demo of my implementation on GitHub Pages: [https://kovdimay.github.io/multitab-particle-bridge/](https://kovdimay.github.io/multitab-particle-bridge/)

## 🚀 Tech Stack

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

- React + TypeScript
- React Three Fiber (Three.js in React)
- GLSL Shaders (Custom point rendering)
- `localStorage`, `BroadcastChannel`
- GitHub Pages for deployment

## 📸 Screenshots

Original video:
![image](https://github.com/user-attachments/assets/c160d3ba-74c2-4c62-b2e9-56f7268c1e26)

My implementation:
![image](https://github.com/user-attachments/assets/f61ffc59-fee2-4a4c-9bc3-533b5cbe2c87)

## 🛠 Run Locally

#### Clone the repo:

```bash
git clone https://github.com/KovDimaY/multitab-particle-bridge.git
cd multitab-particle-bridge
```

#### Install dependencies:

```bash
npm install
```

#### Start development server:

```bash
npm start
```

## 📦 Deployment

To deploy to GitHub Pages:

```bash
npm run deploy
```

## 💡 Inspiration

Huge thanks to **Bjørn Gunnar Staal** ([bgstaal](https://github.com/bgstaal)) for the original concept. This was my attempt to recreate it without access to the source code of the interacting spheres.

## 👋 Final Note

If this project sparks your curiosity — feel free to experiment, contribute, or reach out!
