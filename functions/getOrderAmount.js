function calculateOrderAmount(orders){
    let amount = 0;
    for (const order of orders) {
        for (const product of order.products) {
            amount += Number(product.price) * Number(product.order_item.quantity);
        }
    }
    return amount;
}
module.exports = calculateOrderAmount;