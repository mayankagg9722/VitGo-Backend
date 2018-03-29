var itemsSchema = mongoose.Schema({
	item : String
});

var itemsTable = mongoose.model('items', itemsSchema, 'items');
exports.itemsTable = itemsTable;