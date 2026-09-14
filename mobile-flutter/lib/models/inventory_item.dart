class InventoryItemModel {
  final int id;
  final String itemName;
  final String category;
  final int quantity;
  final String unitOfMeasure;
  final int minimumThreshold;
  final String status;
  final String location;

  InventoryItemModel({
    required this.id,
    required this.itemName,
    required this.category,
    required this.quantity,
    required this.unitOfMeasure,
    required this.minimumThreshold,
    required this.status,
    required this.location,
  });

  factory InventoryItemModel.fromJson(Map<String, dynamic> json) {
    return InventoryItemModel(
      id: json['id'] ?? 0,
      itemName: json['itemName'] ?? '',
      category: json['category'] ?? '',
      quantity: json['quantity'] ?? 0,
      unitOfMeasure: json['unitOfMeasure'] ?? '',
      minimumThreshold: json['minimumThreshold'] ?? 0,
      status: json['status'] ?? 'InStock',
      location: json['location'] ?? '',
    );
  }
}
