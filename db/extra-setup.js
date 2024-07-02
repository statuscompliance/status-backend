export default function applyExtraSetup(sequelize) {
  const { User, Thread, Message, Catalog, Control, Input, InputControl, Mashup } = sequelize.models;

  User.hasMany(Thread);
  Thread.belongsTo(User);
  
  Thread.hasMany(Message);
  Message.belongsTo(Thread);
  
  Catalog.hasMany(Control, {foreignKey: 'catalog_id'});
  Control.belongsTo(Catalog, {foreignKey: 'catalog_id'});

  Mashup.hasMany(Control, {foreignKey: 'mashup_id'});
  Control.belongsTo(Mashup, {foreignKey: 'mashup_id'});

  Mashup.hasMany(Input, {foreignKey: 'mashup_id'});
  Input.belongsTo(Mashup, {foreignKey: 'mashup_id'});
  
  Input.hasMany(InputControl, {foreignKey: 'input_id'});
  InputControl.belongsTo(Input, {foreignKey: 'input_id'});
  
  Control.hasMany(InputControl, {foreignKey: 'control_id'});
  InputControl.belongsTo(Control, {foreignKey: 'control_id'});
}