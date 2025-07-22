export default function applyExtraSetup(sequelize) {
  const {
    User,
    Thread,
    Message,
    Catalog,
    Control,
    Computation,
    Panel,
    Secret,

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

  // A Secret belongs to one User
  Secret.belongsTo(User, {
    foreignKey: 'ownerId', // The foreign key column in the 'secrets' table
    as: 'owner',           // Optional: alias for when retrieving the associated user (e.g., secret.getOwner())
  });

  // A User can have many Secrets
  User.hasMany(Secret, {
    foreignKey: 'ownerId', // The foreign key column in the 'secrets' table that links back to 'users'
    as: 'secrets',         // Optional: alias for when retrieving associated secrets (e.g., user.getSecrets())
    onDelete: 'CASCADE',   // Matches your model's onDelete: 'CASCADE' for referential integrity
  });

}

