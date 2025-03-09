# Plant Doctor API

A Deno-based API service that analyzes plant images to detect diseases using the Microsoft ResNet-50 model from Hugging Face. This service powers the Plant Doctor application, helping users diagnose plant health issues and providing treatment recommendations.

## 🌳🌲 Overview

Plant Doctor API is a TypeScript backend service built with Deno that:

1. Accepts plant image URL
2. Processes images using machine learning to detect diseases
3. Stores analysis results and user data in PostgreSQL via Supabase
4. Provides a RESTful API for the Plant Doctor frontend application
5. Deployed to Deno Deploy for reliable, scalable service

## 🚀 Tech Stack

- **Runtime**: [Deno](https://deno.land/) - A secure JavaScript and TypeScript runtime
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript for better developer experience
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) - Open-source database management
- **ML Model**: [Microsoft ResNet-50](https://huggingface.co/microsoft/resnet-50) via Hugging Face - Pre-trained image classification model
- **Deployment**: [Deno Deploy](https://deno.com/deploy) - Global edge runtime for Deno applications

## 📋 Prerequisites

- [Deno](https://deno.land/#installation) v1.38 or higher
- [Supabase Account](https://supabase.com/) for database access
- [Hugging Face Account](https://huggingface.co/join) for API token

## ⚙️ Environment Variables

Create a `.env` file in the root directory and use the variables from `.env.example` with real values

## 🏃‍♂️ Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/plant-doctor-api.git
   cd plant-doctor-api
   ```

2. Install dependencies:
   ```bash
   deno cache --lock=lock.json --lock-write deps.ts
   ```

### Local Development

Start the development server:

```bash
deno task start
```

This runs the API on `http://localhost:8000`.

## 🔄 API Endpoints

### POST /api/v1/predict

Provide a plant name and its image URL for disease diagnosis.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

For any questions or suggestions, please reach out to [hariharan.2309.s@icloud.com](mailto:hariharan.2309.s@icloud.com).
