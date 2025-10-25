import { prisma } from '../../../database';

export default async function handler(req, res) {
    if(req.method === 'POST') {
        const { body } = req;

        if(!body.name) {
            return res.status(400).json({ error: 'Name not set' });
        }

        const skill = await prisma.skill.create({
            data: {
                name: body.name,
                description: body.description || '',
                attribute_id: body.attribute_id ? Number(body.attribute_id) : null
            }
        });

        return res.status(200).json(skill);
    }
    else if(req.method === 'GET') {
        const skills = await prisma.skill.findMany({
            include: {
                attribute: true
            }
        });
        return res.status(200).json(skills);
    }
    else {
        return res.status(404);
    }
}
