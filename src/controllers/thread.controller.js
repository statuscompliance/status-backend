import models from '../../db/models.js'
import sequelize from '../../db/database.js'
import OpenAI from "openai"
import jwt from 'jsonwebtoken'

const openai = new OpenAI({
    organization: process.env.AI_ORG_ID,
    apiKey: process.env.AI_API_KEY
});

export async function getThreads(req, res) {
    try {
        const threads = await models.Thread.findAll();
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to get threads, error: ${error.message}` });
    }   
}

export async function getThreadsByUserId(req, res) {
    try {
        const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
        const userId = decoded.user_id
        const threads = await models.Thread.findAll({
            where: {
                UserId: userId
            }
        });

        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to get threads, error: ${error.message}` })
    }
}

export async function deleteThread(req, res) {
    try {
        const { gptId } = req.params

        const thread = await models.Thread.findAll({
            where: {
                gpt_id: gptId
            }
        });

        if (thread[0].length === 0) {
            return res.status(404).json({ message: `Thread ${gptId} not found` })
        }
        const threadId = thread[0][0].id

        await models.Message.destroy({
            where: {
                threadId: threadId
            }
        });
        await models.Thread.destroy({
            where: {
                gpt_id: gptId
            }
        });

        await openai.beta.threads.del(gptId)
        res.status(200).json({ message: `Thread ${gptId} deleted successfully` })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to delete thread, error: ${error.message}` })
    }
}

const validMsg = (content) => {
    console.log(content);
    const charactersLength = content.length;
    const words = content.split(' ');
    return words.length >= 6 || charactersLength >= 40;
}

export async function createThread(req, res) {
    const { assistantId } = req.body;
    const { content } = req.body;
    console.log(content);

    const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1];
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const username = decoded.username;

    try {
        const user = await models.User.findOne({ where: { username: username } });
        const userId = user.id;

        if (!validMsg(content)) {
            return res.status(400).json({ error: 'Por favor, haz el mensaje un poco más detallado' });
        }

        await sequelize.transaction(async (transaction) => {
            const runThread = await openai.beta.threads.createAndRun({
                assistant_id: assistantId,
                thread: {
                    messages: [{ role: "user", content: content }],
                },
            });
            console.log(runThread);
            const threadId = await insertThread(transaction, runThread.thread_id, userId, runThread.id);
            console.log("HERE, line 107",threadId);

            await insertMessage(transaction, content, threadId);

            return res.status(201).json({ id: runThread.thread_id, message: 'Hilo creado exitosamente' });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: `Error al crear el hilo, error: ${error}` });
    }
}

export async function addNewMessage(req, res) {
    const { gptId } = req.params;
    const { content, assistantId } = req.body;

    try {
        if (!validMsg(content)) {
            return res.status(400).json({ error: 'El mensaje debe tener al menos 15 palabras' });
        }

        await sequelize.transaction(async (transaction) => {
            const threadMessage = await openai.beta.threads.messages.create(gptId, { role: "user", content: content });

            const thread = await openai.beta.threads.runs.create(gptId, { assistant_id: assistantId });

            const threadId = await models.Thread.findOne({ where: { gpt_id: gptId } }, { transaction });

            await insertMessage(transaction, content, threadId.id);

            return res.status(201).json({ message: 'Mensaje agregado exitosamente' });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al crear el hilo' });
    }
}


export async function getThreadMessages(req, res) {
    const { gptId } = req.params
    try {
        const thread = await models.Thread.findOne({
            where: {
                gpt_id: gptId
            }
        });
        const runId = thread.run_id;
        const runStatus = await openai.beta.threads.runs.retrieve(gptId, runId);
        if (runStatus.status === "completed") {
            const messageList = await openai.beta.threads.messages.list(gptId);
            res.status(200).json(messageList);
        } else {
            res.status(200).json({ message: 'Run not completed yet' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error al obtener mensajes del hilo. Error: ${error}` });
    }
}

export async function deleteUserThreads(req,res){
    const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    const userId = decoded.user_id
    try {

        await sequelize.transaction(async (transaction) => {
            await models.Message.destroy({
                where: {
                    threadId: userId
                }
            }, { transaction });
            await models.Thread.destroy({
                where: {
                    UserId: userId
                }
            }, { transaction });
            res.status(200).json({ message: 'Threads deleted successfully' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to delete threads, error: ${error.message}` });
    }
}

export async function changeThreadName(req, res){
    const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    const userId = decoded.user_id
    const { gptId } = req.params
    const { name } = req.body
    try {

        const thread = await models.Thread.update({
            name
        }, {
            where: {
                gpt_id: gptId,
                UserId: userId
            }
        });

        if (thread[0].length === 0) {
            return res.status(404).json({ message: `Thread ${gptId} not found` })
        }
        res.status(200).json({ message: `Thread ${gptId} name updated successfully` })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to update thread name, error: ${error.message}` })
    }
}

async function insertThread(transaction, gptId, userId, runId){
    try {
        const result = await models.Thread.create({
            gpt_id: gptId,
            UserId: userId,
            name: "Nuevo Hilo",
            run_id: runId
        }, { transaction });
        return result.id;
    } catch (error) {
        console.error(error);
        throw new Error(`Error al insertar el hilo en la base de datos, error: ${error.message}`);
    }
}

async function insertMessage(transaction, content, threadId){
    try {
        const result = await models.Message.create({
            content,
            threadId: threadId
        }, { transaction });
        console.log("result", result);
        return result.id;
    } catch (error) {
        console.error(error);
        throw new Error(`Error al insertar el mensaje en la base de datos, error: ${error.message}`);
    }
}
