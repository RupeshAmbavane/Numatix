import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/database";
import crypto from "crypto";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Simple encryption/decryption for API keys (in production, use proper key management)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-cbc";

if (!ENCRYPTION_KEY) {
  console.warn(
    "WARNING: ENCRYPTION_KEY not set. API keys will use base64 encoding (not secure)."
  );
}

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    // Fallback: base64 encoding (not secure, but better than plaintext)
    return Buffer.from(text).toString("base64");
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  binanceApiKey: z.string().min(1),
  binanceSecretKey: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", authLimiter, async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { email, password, binanceApiKey, binanceSecretKey } = validated;

    console.log("Registration attempt for email:", email);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Encrypt API keys
    const encryptedApiKey = encrypt(binanceApiKey);
    const encryptedSecretKey = encrypt(binanceSecretKey);
    console.log("API keys encrypted");

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        binanceApiKey: encryptedApiKey,
        binanceSecretKey: encryptedSecretKey,
      },
    });

    console.log("User created successfully:", user.id, user.email);

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("Registration successful, token generated");

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    console.log("Login attempt for email:", email);
    console.log("Request body:", req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("User found in database:", user);

    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found, verifying password...");

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      console.log("Password verification failed for user:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Password verified, generating token...");

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("Login successful for user:", email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

export { router as authRouter };
