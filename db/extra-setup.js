export default function applyExtraSetup(sequelize) {
    const {
        User,
        Thread,
        Message,
        Catalog,
        Control,
        InputControl,
        Computation,
        Panel,
    } = sequelize.models;

    User.hasMany(Thread);
    Thread.belongsTo(User);

    Thread.hasMany(Message);
    Message.belongsTo(Thread);

    Catalog.hasMany(Control, { foreignKey: "catalog_id" });
    Control.belongsTo(Catalog, { foreignKey: "catalog_id" });

    Control.hasMany(InputControl, { foreignKey: "control_id" });
    InputControl.belongsTo(Control, { foreignKey: "control_id" });

    Control.hasMany(Computation, { foreignKey: "control_id" });
    Computation.belongsTo(Control, { foreignKey: "control_id" });

    Control.hasMany(Panel, { foreignKey: "control_id" });
    Panel.belongsTo(Control, { foreignKey: "control_id" });
}
