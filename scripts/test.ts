// Test script for the Plant Disease Detection API

/**
 * Simple test to check if the API is running and responding correctly
 */
async function testAPI() {
  try {
    console.log("📋 Testing Plant Disease Detection API...");

    // Test health endpoint
    console.log("\n🔍 Testing health endpoint...");
    const healthResponse = await fetch("http://localhost:8000/health");
    const healthData = await healthResponse.json();
    console.log("✅ Health check response:", healthData);

    // Test prediction with a sample image
    console.log("\n🔍 Testing prediction endpoint...");
    await testPrediction();
  } catch (error: any) {
    console.error("❌ API test failed:", error.message);
    console.error(
      "Make sure the API server is running first with 'deno task dev'"
    );
  }
}

/**
 * Test the prediction endpoint with a sample image
 */
async function testPrediction() {
  // Replace with the path to your plant image
  const imagePath = "./sample_images/tomato_late_blight.jpg";

  try {
    // Check if the file exists
    try {
      await Deno.stat(imagePath);
    } catch (error) {
      console.error(`❌ Test image not found at ${imagePath}`);
      console.log(
        "Please create a 'sample_images' folder and add a test image."
      );
      return;
    }

    // Create form data with the image
    const form = new FormData();
    const fileBlob = new Blob([await Deno.readFile(imagePath)]);
    form.append("image", fileBlob, "plant.jpg");

    // Send the request
    const response = await fetch("http://localhost:8000/api/v1/predict", {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(
        `API responded with status ${response.status}: ${await response.text()}`
      );
    }

    const result = await response.json();
    console.log("✅ Prediction result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Prediction test failed:", error.message);
  }
}

// Run the tests
await testAPI();
