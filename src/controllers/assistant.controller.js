import {pool} from '../db.js'
import OpenAI from "openai"

import fs from 'fs/promises'

const openai = new OpenAI({
    organization: process.env.AI_ORG_ID,
    apiKey: process.env.AI_API_KEY
});

export async function createAssistant(req,res){
    try {
        const { name } = req.body
        const instructions = await readInstructions('./assistant-instructions.txt')
        const assistant = await openai.beta.assistants.create({
            name: name,
            instructions: instructions,
            tools: [{"type":"code_interpreter"}],
            model: "gpt-3.5-turbo-0125"
        });
        const insertedAssistant = await pool.query('INSERT INTO assistant (assistantId, name, instructions, tools, model) VALUES (?, ?, ?, ?, ?)', [assistant.id, name, instructions, assistant.tools, assistant.model]);
        res.status(201).json({message:`Assistant ${name} with id ${assistant.id} created successfully`});
    } catch (error) {
        res.status(500).json({ message: `Failed to create assistant, error: ${error.message}` })
    }
}

export async function getAssistants(req,res){
    try {
        const assistants = await pool.query('SELECT * FROM assistant')
        res.status(200).json(assistants[0]);
    } catch (error) {
        res.status(500).json({ message: `Failed to get assistants, error: ${error.message}` })
    }
}

export async function renewAssistant(req,res){
    try {
        await pool.query('DELETE FROM assistant')

        const { name } = req.body
        const instructions = await readInstructions('./assistant-instructions.txt')
        const assistant = await openai.beta.assistants.create({
            name: name,
            instructions: instructions,
            tools: [{"type":"code_interpreter"}],
            model: "gpt-3.5-turbo-0125"
        });
        const insertedAssistant = await pool.query('INSERT INTO assistant (assistantId, name, instructions, tools, model) VALUES (?, ?, ?, ?, ?)', [assistant.id, name, instructions, assistant.tools, assistant.model]);
        res.status(201).json({message:`Assistant ${name} with id ${assistant.id} created successfully`});
    } catch (error) {
        res.status(500).json({ message: `Failed to create assistant, error: ${error.message}` })
    }
}

async function readInstructions(file){
    try {
        const instructions = await fs.readFile(file, 'utf8')
        return instructions
    } catch (error) {
        console.error(error.message)
    }
}