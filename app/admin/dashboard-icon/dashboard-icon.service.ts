import { DashboardIcon} from '../../common/models/dashboard-icon.model'


export const createDashboardIcon = async (data: any) => {
    const result = await DashboardIcon.create(data);
    return result;
};

export const getAllDashboardIcons = async () => {
    const result = await DashboardIcon.find().select('_id name icon');
    return result;
};






