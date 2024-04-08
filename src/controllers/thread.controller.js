import {pool} from '../db.js'
import OpenAI from "openai"
import jwt from 'jsonwebtoken'

const openai = new OpenAI({
    organization: process.env.AI_ORG_ID,
    apiKey: process.env.AI_API_KEY
});

export async function getThreadsByUserId(req, res) {
    try {
        const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
        const userId = decoded.user_id
        const threads = await pool.query('SELECT * FROM thread WHERE user_id = ?', [userId])
        res.status(200).json(threads[0])
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to get threads, error: ${error.message}` })
    }
}

export async function deleteThread(req, res) {
    try {
        const { gptId } = req.params
        const thread = await pool.query('SELECT * FROM thread WHERE gpt_id = ?', [gptId])
        if (thread[0].length === 0) {
            return res.status(404).json({ message: `Thread ${gptId} not found` })
        }
        const threadId = thread[0][0].id
        await pool.query('DELETE FROM message WHERE thread_id = ?', [threadId]);
        await pool.query('DELETE FROM thread WHERE gpt_id = ?', [gptId])
        await openai.beta.threads.del(gptId)
        res.status(200).json({ message: `Thread ${gptId} deleted successfully` })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to delete thread, error: ${error.message}` })
    }
}

const validMsg = (content) => {
    const charactersLength = content.length;
    const words = content.split(' ');
    return words.length >= 6 || charactersLength >= 40;
}

export async function createThread(req, res) {
    const { assistantId } = req.body
    const content  = JSON.stringify(req.body.content)
    const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    const username = decoded.username

    try {
        const user = await pool.query('SELECT * FROM User WHERE username = ?', [username])
        const userId = user[0][0].id
        if (!validMsg(content)){
            return res.status(400).json({ error: 'Por favor, haz el mensaje un poco más detallado' });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        const runThread = await openai.beta.threads.createAndRun({
            assistant_id: assistantId,
            thread: {
                messages: [
                    {
                        role: "user",
                        content: content
                    },
                ],
            },
        });

        const threadId = await insertThread(connection, runThread.thread_id, userId, runThread.id);

        await insertMessage(connection, content, threadId);

        await connection.commit();
        await connection.release();

        return res.status(201).json({ id: runThread.thread_id , message: 'Hilo creado exitosamente' });
    } catch (error) {
        console.error(error);
        pool.releaseConnection();
        return res.status(500).json({ error: `Error al crear el hilo, error: ${error}` });
    }
}

export async function addNewMessage(req, res) {
    const { gptId } = req.params
    const content = JSON.stringify(req.body.content)
    const assistantId = req.body.assistantId
    try{
        if (!validMsg(content)){
            return res.status(400).json({ error: 'El mensaje debe tener al menos 15 palabras' });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        const threadMessage = await openai.beta.threads.messages.create(gptId, {
            role: "user",
            content: content
        });

        const thread = await openai.beta.threads.runs.create(gptId, {
            assistant_id: assistantId
        });

        const threadId = await pool.query('SELECT id FROM thread WHERE gpt_id = ?', [gptId]);
        const newId = threadId[0][0]
        await insertMessage(connection, content, newId.id);

        await connection.commit();
        await connection.release();
        return res.status(201).json({ message: 'Mensaje agregado exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al crear el hilo' });
    }
}

export async function getThreadMessages(req, res) {
    const { gptId } = req.params
    try {
        const rows = await pool.query('SELECT run_id FROM thread WHERE gpt_id = ?', [gptId]);
        const runId = rows[0][0].run_id;
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
        await pool.query('DELETE FROM message WHERE thread_id IN (SELECT id FROM thread WHERE user_id = ?)', [userId]);
        await pool.query('DELETE FROM thread WHERE user_id = ?', [userId]);
        res.status(200).json({ message: 'Threads deleted successfully' });
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
        const thread = await pool.query('UPDATE thread SET name = ? WHERE gpt_id = ? AND user_id = ?', [name, gptId, userId])
        if (thread[0].length === 0) {
            return res.status(404).json({ message: `Thread ${gptId} not found` })
        }
        res.status(200).json({ message: `Thread ${gptId} name updated successfully` })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to update thread name, error: ${error.message}` })
    }
}

async function insertThread(connection, gptId, userId, runId){
    try {
        const [result] = await connection.query('INSERT INTO thread (gpt_id, user_id, name, run_id) VALUES (?, ?, ?, ?)', [gptId, userId, "Nuevo Hilo",runId])
        return result.insertId;
    } catch (error) {
        console.error(error);
        throw new Error(`Error al insertar el hilo en la base de datos, error: ${error.message}`);
    }
}

async function insertMessage(connection, content, threadId){
    try {
        const [result] = await connection.query('INSERT INTO message (content, thread_id) VALUES (?, ?)', [content, threadId]);
        return result.insertId;
    } catch (error) {
        console.error(error);
        throw new Error(`Error al insertar el mensaje en la base de datos, error: ${error.message}`);
    }
}
