import { Router, Request, Response } from 'express';
import { IConversation, Conversation, Message } from '../models/conversation';
import { queryFlaskServer } from '../service/flaskService';
import { generateId, parseConversation } from '../utils';
import { chatValidator, startConversationValidator } from './validators';

const router = Router();

router.post('/start', startConversationValidator, async (req: Request, res: Response) => {
    let { model_name } = req.body
    const conversation = new Conversation({
        model_name,
        conversation_id: generateId(9),
        messages: []
    });

    await conversation.save();

    res.status(200).json({ conversation: parseConversation(conversation) });
})

router.post('/chat', chatValidator, async (req: Request, res: Response) => {
    const { model_name, message, conversation_id } = req.body;

    try {
        const conversation = await findConversation(conversation_id);
        const generatedText = await generateResponse(model_name, message, conversation_id);
        await updateConversation(conversation, message, generatedText);

        res.status(201).json({ conversation: parseConversation(conversation) });
    } catch (error: any) {
        console.error(error);
        if (error.message === "Couldn't find conversation") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error processing query' });
        }
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const conversations = await Conversation.find().sort({ timestamp: -1 });
        res.json({conversations: conversations.map(parseConversation)});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    const conversationId = req.params.id;
    if (!conversationId) {
        res.status(400).json({ error: 'conversation id is required' });
        return
    }

    try {
        const conversation = await Conversation.findOne({ conversation_id: conversationId });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({conversation: parseConversation(conversation)});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching conversation' });
    }
});

async function findConversation(conversation_id: string): Promise<IConversation> {
    const conversation = await Conversation.findOne({conversation_id});
    if (!conversation) throw new Error("Couldn't find conversation");
    return conversation;
}

async function generateResponse(model_name: string, message: string, conversation_id: string): Promise<string> {
    const flaskResponse = await queryFlaskServer(model_name, message, conversation_id);
    return flaskResponse.data.response;
}

async function updateConversation(conversation: IConversation, message: string, aiResponse: string) {
    const userMessage = new Message({ role: "user", content: message });
    const aiMessage = new Message({ role: "ai", content: aiResponse });
    conversation.messages.push(userMessage, aiMessage);
    await conversation.save();
}


export default router;
