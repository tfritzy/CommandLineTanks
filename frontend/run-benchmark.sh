#!/bin/bash

echo "Starting development server..."
echo "Once the server starts, open http://localhost:5173/benchmark.html in your browser"
echo ""
echo "You can also access the benchmark from the browser console by running:"
echo "  runMushroomBenchmark()"
echo ""

cd "$(dirname "$0")"
npm run dev
