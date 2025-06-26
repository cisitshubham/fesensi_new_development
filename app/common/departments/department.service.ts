import { formatTime } from '../helper/formatTIme'
import {Department,IDepartments} from '../models/departments.model'

export const createDepartment = async (data:IDepartments) => {
  const Departments = new Department({
	...data,
  });
  await Departments.save();
  return Departments;
}

export const createBulkDepartment = async (data: IDepartments[]) => {
  const validDepartments = data.filter(item => item.name && item.name.trim() !== '').map(item => ({
    ...item,
  }));
  if (validDepartments.length === 0) {
    throw new Error('No valid departments to insert. Each department must have a name.');
  }
  await Department.insertMany(validDepartments);
  return validDepartments;
}

export const getDepartments = async (query: any) => {
  const Departments = await Department.find(query).sort({ createdAt: -1 });
  return Departments;
}

export const getDepartmentById = async (id: string) => {
  const Departments = await Department.findById(id);
  return Departments;
}

export const updateDepartment = async (id: string, data: Partial<IDepartments>) => {
  const updatedData = {
	...data,
	updatedAt: Date.now()
  };
  const Departments = await Department.findByIdAndUpdate(id, updatedData, { new: true });
  return Departments;
}

export const deleteDepartment = async (id: string) => {
  const Departments = await Department.findByIdAndDelete(id);
	return Departments;
}

export const toggleDepartmentStatus = async (id: string) => {
    const Departments = await Department.findById(id);
  if (!Departments) {
  throw new Error('Industry type not found');
    }
  Departments.status = Departments.status ? false : true;
  return Departments;
}

export const getDetailsByName = async (name:string)=>{
	const Departments = await Department.findOne({name:name}).select('name description status');
	return Departments;
}

