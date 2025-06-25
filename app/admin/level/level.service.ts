import { Level } from '../../common/models/level.model';


export const createLevel = async (data: any) => {
    const result = await Level.create(data);
    return result;
};

export const getAllLevels = async () => {
    const result = await Level.find().select('_id name');
    return result;
};