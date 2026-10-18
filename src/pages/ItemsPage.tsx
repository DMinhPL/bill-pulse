import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { ItemDeepDiveView } from '../components/ItemDeepDiveView';
import { NotFoundState } from './NotFoundState';
import { ROUTES, findBySlug, itemPath } from '../routes';

/** /items/:itemSlug: price history of one product. /items alone opens the first product. */
export const ItemsPage: React.FC = () => {
  const { priceTrends } = useAppData();
  const { itemSlug } = useParams();
  const navigate = useNavigate();

  const item = findBySlug(priceTrends, itemSlug, t => t.canonicalName);
  usePageTitle(item ? item.canonicalName : 'Chi tiết mặt hàng');

  // Give "/items" a real product URL so it can be shared and bookmarked
  if (!itemSlug && priceTrends.length > 0) {
    return <Navigate to={itemPath(priceTrends[0].canonicalName)} replace />;
  }

  if (itemSlug && !item) {
    return (
      <NotFoundState
        title="Không tìm thấy mặt hàng"
        message="Sản phẩm này chưa có trong các hóa đơn của bạn."
        backTo={ROUTES.prices}
        backLabel="Xem danh sách biến động giá"
      />
    );
  }

  return (
    <ItemDeepDiveView
      priceTrends={priceTrends}
      selectedItemName={item?.canonicalName ?? null}
      onSelectItem={name => navigate(itemPath(name))}
    />
  );
};
