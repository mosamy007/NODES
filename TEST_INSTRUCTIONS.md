# Testing Instructions

## How to Test the Animated GIF Combiner

1. **Open the page**: Navigate to `http://localhost:8000/index.html` in your browser

2. **Click "Create Test Collage"** button
   - This will create 4 test NFTs (2 static, 2 animated GIFs from Giphy)
   - It will auto-proceed to the collage view

3. **Click "Generate Collage"** to create the static preview

4. **Click "Download GIF"** to test the animated GIF combiner
   - Open browser console (F12) to see detailed logs
   - You should see:
     - "Found 2 animated NFTs out of 4 selected"
     - "Extracting frames from: NODES #2 (Animated GIF)"
     - "Found X frames in GIF"
     - "Successfully extracted X frames"
     - "Creating X collage frames..."
     - "Rendering GIF: X%"
     - "GIF rendering finished!"

5. **Check for errors**:
   - If you see "Failed to fetch GIF" → CORS issue with proxy
   - If stuck at "Creating static collage GIF..." → No animated NFTs detected
   - If you see "GifReader is not defined" → omggif library didn't load

## Expected Behavior

- **With animated NFTs**: Should extract frames and combine them into one animated GIF
- **Without animated NFTs**: Should create a static single-frame GIF
- **Video download**: Should extract frames and create WebM video

## Console Logs to Check

```
=== Starting generateRealAnimatedCollage ===
Found 2 animated NFTs out of 4 selected
Extracting frames from: NODES #2 (Animated GIF)
Found 15 frames in GIF
Successfully extracted 15 frames
Total frames to generate: 15
Creating 15 collage frames...
All frames added to GIF. Starting render...
GIF rendering progress: 50%
GIF rendering progress: 100%
GIF rendering finished! Blob size: 123456
```
