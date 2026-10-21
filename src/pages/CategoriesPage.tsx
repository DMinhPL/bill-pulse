import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { CategoryBrowserView, categoryOf } from '../components/CategoryBrowserView';
import { NotFoundState } from './NotFoundState';
import { ROUTES, categoryPath, findBySlug, itemPath } from '../../shared/routes';

/** /categories (all) and /categories/:categorySlug (one category). */
export const CategoriesPage: React.FC = () => {
  const { priceTrends } = useAppData();
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  const categoryNames = useMemo(() => Array.from(new Set(priceTrends.map(categoryOf))), [priceTrends]);
  const selected = findBySlug(categoryNames, categorySlug, name => name) ?? null;
  usePageTitle(selected ? `Danh mục: ${selected}` : 'Danh mục');

  if (categorySlug && !selected) {
    return (
      <NotFoundState
        title="Không tìm thấy danh mục"
        message="Danh mục này không có trong dữ liệu của bạn."
        backTo={ROUTES.categories}
        backLabel="Xem tất cả danh mục"
      />
    );
  }

  return (
    <CategoryBrowserView
      priceTrends={priceTrends}
      selectedCategory={selected}
      onSelectCategory={category => navigate(categoryPath(category))}
      onSelectItemDeepDive={name => navigate(itemPath(name))}
    />
  );
};
