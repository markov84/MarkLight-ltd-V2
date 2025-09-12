import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import ProductCard from '../components/ProductCard';

export default function VirtualizedProductGrid({ products, onAddToCart, onOpenProduct, cartItems = [] }) {
  // 4 колони и 3 реда (до 12 продукта)
  const columnCount = 4;
  const rowCount = 3;
  const itemHeight = 300;
  const itemWidth = 320;

  // Grid cell renderer
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const idx = rowIndex * columnCount + columnIndex;
    if (idx >= products.length) return null;
    const product = products[idx];
    // Find quantity in cart for this product
    const inCartQty = cartItems.find(item => item._id === product._id)?.quantity || 0;
    return (
      <div style={style}>
        <ProductCard
          key={product._id}
          product={product}
          productIndex={idx}
          onAddToCart={() => onAddToCart(product)}
          onCardClick={() => onOpenProduct(product._id)}
          inCartQty={inCartQty}
        />
      </div>
    );
  };

   
  // ВИНАГИ показвай 3 реда по 4 продукта (общо 12), дори ако има по-малко продукти
  return (
    <Grid
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={itemWidth}
      rowHeight={itemHeight}
      height={itemHeight * rowCount}
      width={itemWidth * columnCount + 32}
      className="mx-auto"
    >
      {Cell}
    </Grid>
  );
}
