import OptionPicker from "./OptionPicker";
import { useProductDetail } from "../../hooks/storefront/useProductDetail";
import type { ProductDetail } from "../../wix/storefront/types";

export default function ProductPurchase({ initial }: { initial: ProductDetail }) {
  const detail = useProductDetail({ initial, slug: initial.slug });
  const product = detail.product ?? initial;

  return (
    <article className={`product-detail${product.gallery.length ? " product-detail-with-media" : ""}`}>
      <div className="product-detail-copy">
        <h1>{product.name}</h1>
        {detail.price && <p className="product-price">
          {detail.compareAtPrice && <s>{detail.compareAtPrice} </s>}
          {detail.price}
          {detail.pricePerUnit && <> · {detail.pricePerUnit}</>}
        </p>}
        <OptionPicker detail={detail} showQuantity />
      </div>
      {product.gallery.length > 0 && <div className="product-gallery">
        {product.gallery.map((url, index) => <img key={url} src={url} alt={index ? `${product.name}, view ${index + 1}` : product.name} loading={index ? "lazy" : "eager"} />)}
      </div>}
    </article>
  );
}
