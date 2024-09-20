"use client"

import { useEffect, useRef, useState } from "react";

export default function Home() {

  // creating a HTML canvas to draw and using useref so that our component doesn't re-render
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // if user is drawing or not 
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    // initializing the canvas
    const canvas = canvasRef.current

    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight - canvas.offsetTop
        ctx.lineCap = "round" // for brush type 
        ctx.lineWidth = 3 // for brush size
      }
    }
  }, [])


  // when user wants to start drawing this function runs takes mouseEvent as an argument
  const StartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (canvas) {
      // setting the bgc and setting the 2d context
      canvas.style.backgroundColor = 'black';

      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true)
      }
    }
  }

  const StopDrawing = () => {
    setIsDrawing(false)
  }

  // Function to implement the drawing method
  const Draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return
    }
    // we only draw when isDrawing is true
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // white brush, Line to to follow our brush and stroke function to draw whereever the lineto function is called
        ctx.strokeStyle = "white"
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      className="absolute top-0 left-0 w-full h-full"

      onMouseDown={StartDrawing}
      onMouseMove={Draw}
      onMouseOut={StopDrawing}
      onMouseUp={StopDrawing}
    />
  );
}
