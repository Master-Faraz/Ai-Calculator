"use client"

import { Button } from "@/components/ui/button";
import { SWATCHES } from "@/lib/constants";
import { ColorSwatch, Group } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Draggable from 'react-draggable';



interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}


export default function Home() {

  // creating a HTML canvas to draw and using useref so that our component doesn't re-render
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false)// if user is drawing or not
  const [color, setColor] = useState('rgb(255,255,255)') // state to hold the selected color
  const [reset, setReset] = useState(false) //  Resetting the DrawBoard
  const [result, setResult] = useState<GeneratedResult>(); // response from the server -> {expression,answer}
  const [dictOfVars, setDictOfVars] = useState({}); // To hold the assigned values to variable -> x=5, y=10

  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);




  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);


  const renderLatexToCanvas = (expression: string, answer: string) => {
    const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
    setLatexExpression([...latexExpression, latex]);

    // Clear the main canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // For reset the canvas
  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(undefined);
      setDictOfVars({});
      setReset(false);
    }
  }, [reset])


  // To initialize the canvas on the start
  useEffect(() => {
    const canvas = canvasRef.current // initializing the canvas

    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight - canvas.offsetTop
        ctx.lineCap = "round" // for brush type 
        ctx.lineWidth = 3 // for brush size
      }
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
      });
    };

    return () => {
      document.head.removeChild(script);
    };

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
        ctx.strokeStyle = color
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  }

  // Reset canvas function
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  // Function to send the canvas image to the backend
  const runRoute = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const response = await axios({
        method: 'post',
        url: `${process.env.NEXT_PUBLIC_API_URL}/calculate`,
        data: {
          image: canvas.toDataURL('image/png'),
          dict_of_vars: dictOfVars
        }
      });

      const resp = await response.data;
      console.log('Response', resp);
      resp.data.forEach((data: Response) => {
        if (data.assign === true) {
          // dict_of_vars[resp.result] = resp.answer;
          setDictOfVars({
            ...dictOfVars,
            [data.expr]: data.result
          });
        }
      });
      const ctx = canvas.getContext('2d');
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setLatexPosition({ x: centerX, y: centerY });
      resp.data.forEach((data: Response) => {
        setTimeout(() => {
          setResult({
            expression: data.expr,
            answer: data.result
          });
        }, 1000);
      });
    }
  };

  return (
    <main>
      <section className='flex  gap-2'>
        <Button
          onClick={() => setReset(true)}
          className='z-20 bg-gray-900 text-white w-2/12 '
          variant='default'
          color='black'
        >Reset </Button>


        <Group className='z-20 w-8/12 '>
          <div className="flex justify-center w-full gap-6">
            {SWATCHES.map((swatch) => (
              <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
            ))}
          </div>
        </Group>


        <Button
          onClick={runRoute}
          className='z-20 bg-gray-900 text-white w-2/12'
          variant='default'
          color='white'
        >  Run </Button>

      </section>


      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"

        onMouseDown={StartDrawing}
        onMouseMove={Draw}
        onMouseOut={StopDrawing}
        onMouseUp={StopDrawing}
      />

      {latexExpression && latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          defaultPosition={latexPosition}
          onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
        >
          <div className="absolute p-2 text-white rounded shadow-md">
            <div className="latex-content">{latex}</div>
          </div>
        </Draggable>
      ))}

    </main>
  );
}
