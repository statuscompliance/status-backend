export default function applyExtraSetup(sequelize) {
  const {
    User,
    Thread,
    Message,
    Catalog,
    Control,
    Computation,
    Panel,
  } = sequelize.models;

  User.hasMany(Thread);
  Thread.belongsTo(User);

  Thread.hasMany(Message);
  Message.belongsTo(Thread);

  Catalog.hasMany(Control, { foreignKey: 'catalogId' });
  Control.belongsTo(Catalog, { foreignKey: 'catalogId' });

  Control.hasMany(Computation, { foreignKey: 'controlId' });
  Computation.belongsTo(Control, { foreignKey: 'controlId' });

  Control.hasMany(Panel, { foreignKey: 'controlId' });
  Panel.belongsTo(Control, { foreignKey: 'controlId' });
}
