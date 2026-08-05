import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment automatically.
export const anthropic = new Anthropic();

export const CAPTURE_MODEL = "claude-sonnet-5";
