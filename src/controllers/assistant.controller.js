import models from '../../db/models.js'
import OpenAI from "openai"

import fs from 'fs/promises'

const openai = new OpenAI({
    organization: process.env.AI_ORG_ID,
    apiKey: process.env.AI_API_KEY
});

export async function createAssistant(req,res){
    try {
        const { name } = req.body
        const assistant = await newAssistant(name)
        const response = assistant.assistant.dataValues
        res.status(201).json({message:`Assistant ${name} with id ${response.assistantId} created successfully`});
    } catch (error) {
        res.status(500).json({ message: `Failed to create assistant, error: ${error.message}` })
    }
}



export async function createAssistantWithInstructions(req,res){
    try {
        const { name, instructions, model, tools } = req.body
        const assistant = await openai.beta.assistants.create({
            name: name,
            instructions: instructions,
            tools: tools,
            model: model
        });
        const response = await models.Assistant.create({
            assistantId: assistant.id,
            name: name,
            instructions: instructions,
            tools: tools.toString(),
            model: model,
            status: 'INACTIVE'
        });
        res.status(201).json({message:`Assistant ${name} with id ${response.assistantId} created successfully`});
    } catch (error) {
        res.status(500).json({ message: `Failed to create assistant, error: ${error.message}` })
    }
}

export async function getAssistants(req,res){
    try {
        const assistants = await models.Assistant.findAll();
        res.status(200).json(assistants);
    } catch (error) {
        res.status(500).json({ message: `Failed to get assistants, error: ${error.message}` })
    }
}

export async function getAssistantsById(req,res){
    try {
        const { id } = req.params
        const assistant = await models.Assistant.findByPk(id);
        res.status(200).json(assistant);
    } catch (error) {
        res.status(500).json({ message: `Failed to get assistants, error: ${error.message}` })
    }
}

export async function deleteAllAssistants(req,res){
    try {
        await models.Assistant.destroy({
            where: {},
            truncate: true
        });
        res.status(200).json({message:`All assistants deleted successfully`});
    } catch (error) {
        res.status(500).json({ message: `Failed to delete all assistants, error: ${error.message}` })
    }
}

export async function getAssistantInstructions(req,res){
    try {
        const { id } = req.params
        const assistant = await models.Assistant.findByPk(id);
        const firstAssistant = assistant;
        res.status(200).json({instructions: firstAssistant.instructions});
    } catch (error) {
        res.status(500).json({ message: `Failed to get assistant instructions, error: ${error.message}` })
    }
}

export async function updateAssistantInstructions(req,res){
    try {
        const { id } = req.params
        const { instructions } = req.body
        //await fs.writeFile('./assistant-instructions.txt', instructions) // Uncomment this line to write the instructions to the file
        await models.Assistant.update({instructions: instructions}, {
            where: {
                id: id 
            }
        });
        const updatedAssistant = await models.Assistant.findByPk(id);
        try{
            const response = await openai.beta.assistants.update(updatedAssistant.dataValues.assistantId, {
                instructions: instructions
            });
        } catch (error) {
            console.log(error.message)
        }
        res.status(200).json({message:`Assistant instructions updated successfully}`});
    } catch (error) {
        res.status(500).json({ message: `Failed to update assistant instructions, error: ${error.message}` })
    }
}

export async function deleteAssistantById(req,res){
    try {
        const { id } = req.params
        if (id === 'undefined') {
            res.status(400).json({ message: `Assistant id is required` })
        }
        await models.Assistant.destroy({
            where: {
                id: id
            }
        });
        res.status(200).json({message:`Assistant deleted successfully`});
    } catch (error) {
        res.status(500).json({ message: `Failed to delete the assistant, error: ${error.message}` })
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

async function newAssistant(name, type){
    try {
        const instructions = await readInstructions('./assistant-instructions.txt')
        const assistant = await openai.beta.assistants.create({
            name: name,
            instructions: instructions,
            tools: [{"type":"code_interpreter"}],
            model: "gpt-3.5-turbo-0125"
        });
        const response = await models.Assistant.create({
            assistantId: assistant.id,
            name: name,
            instructions: instructions,
            tools: assistant.tools.toString(),
            model: assistant.model,
            status: 'INACTIVE'
        });
        return {assistant: response , instructions}
    } catch (error) {
        console.error(error.message)
    }
}