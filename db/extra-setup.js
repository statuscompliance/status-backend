export default function applyExtraSetup(sequelize) {
  const { User, Thread, Message, Catalog, Control, Input, InputControl } = sequelize.models;

  User.hasMany(Thread);
  Thread.belongsTo(User);
  
  Thread.hasMany(Message);
  Message.belongsTo(Thread);
  
  Catalog.hasMany(Control);
  Control.belongsTo(Catalog);
  
  Input.hasMany(InputControl);
  InputControl.belongsTo(Input);
  Control.hasMany(InputControl);
  InputControl.belongsTo(Control);
}