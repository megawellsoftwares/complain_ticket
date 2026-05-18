import { StatusCodes } from "http-status-codes";
import departmentModel from "../models/department.js";

export const createDepartment = async (req, res) => {
    const departmentData = req.body;

    try {
        const createdDepartment = await departmentModel.create(departmentData);

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: createdDepartment,
            message: "Department created successfully!",
        });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "department name should be unique",
            error: error?.message || error,
        });
    }
}

export const getDepartments = async (req, res) => {
    try {
        const departments = await departmentModel.find({}).sort({ name: 1 });

        res.status(StatusCodes.OK).json({
            success: true,
            data: departments,
            message: "Departments fetched successfully!",
        });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Error fetching departments",
            error: error?.message || error,
        });
    }
}

export const updateDepartment = async (req, res) => {
    const { name } = req.body;

    try {
        const department = await departmentModel.findById(req.params.id);
        if (department) {
            department.name = name || department.name;
        }

        await department.save();

        res.status(StatusCodes.OK).json({
            success: true,
            data: department,
            message: "Departments updated successfully!",
        });

    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Error updating department",
            error: error?.message || error,
        });
    }


}

export const deleteDepartment = async (req, res) => {
    try {
        const department = await departmentModel.findById(req.params.id);
        if (department) {
          await department.deleteOne();
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: department,
            message: "Department deleted successfully!",
        });

    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Error deleting department",
            error: error?.message || error,
        });
    }
}
