import { OpenApiBuilder } from "../deps.ts";

const builder = new OpenApiBuilder();
builder
  .addOpenApiVersion("3.0.0")
  .addInfo({
    title: "Plant Doctor API",
    version: "1.0.0",
    description: "API documentation for my Deno project",
  })
  .addPath("/predict", {
    post: {
      summary: "Diagnose plant disease using an image",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                image_url: {
                  type: "string",
                  description: "Signed URL of the image of the plant",
                },
                plant_name: {
                  type: "string",
                  description: "Name of the plant for disease prediction",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Diagnosis result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                  },
                  timestamp: {
                    type: "string",
                  },
                  model: {
                    type: "string",
                  },
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        disease: {
                          type: "string",
                        },
                        confidence: {
                          type: "string",
                        },
                        description: {
                          type: "string",
                        },
                      },
                    },
                  },
                  error: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  });

export const openApiSpec = builder.getSpec();
