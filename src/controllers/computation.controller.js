import models from "../../db/models.js";

export async function getComputations(req, res) {
    try {
        const computations = await models.Computation.findAll();
        res.status(200).json(computations);
    } catch (error) {
        res.status(500).json({
            message: `Failed to get computations, error: ${error.message}`,
        });
    }
}

export async function getComputationsById(req, res) {
    try {
        const { id } = req.params;
        const computation = await models.Computation.findByPk(id);
        res.status(200).json(computation);
    } catch (error) {
        res.status(500).json({
            message: `Failed to get computation, error: ${error.message}`,
        });
    }
}

export async function getComputationsByControlId(req, res) {
    try {
        const { control_id } = req.params;
        const computations = await models.Computation.findAll({
            where: { control_id },
        });
        res.status(200).json(computations);
    } catch (error) {
        res.status(500).json({
            message: `Failed to get computations, error: ${error.message}`,
        });
    }
}

export async function createComputation(req, res) {
    try {
        const computation = req.body;
        const newComputation = await models.Computation.create(computation);
        res.status(201).json(newComputation);
    } catch (error) {
        res.status(500).json({
            message: `Failed to create computation, error: ${error.message}`,
        });
    }
}

export async function bulkCreateComputations(req, res) {
    try {
        const computations = req.body;
        const newComputations = await models.Computation.bulkCreate(
            computations
        );
        res.status(201).json(newComputations);
    } catch (error) {
        res.status(500).json({
            message: `Failed to create computations, error: ${error.message}`,
        });
    }
}

export async function deleteComputations(req, res) {
    try {
        await models.Computation.destroy({ where: {} });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({
            message: `Failed to delete computations, error: ${error.message}`,
        });
    }
}

export async function deleteComputationByControlId(req, res) {
    try {
        const { control_id } = req.params;
        await models.Computation.destroy({ where: { control_id } });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({
            message: `Failed to delete computation, error: ${error.message}`,
        });
    }
}
