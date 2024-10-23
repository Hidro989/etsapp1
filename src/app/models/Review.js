import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String },
  customerId: { type: String, required: true },
  email: { type: String, required: true },
  customerName: { type: String },
  rating: { type: Number, required: true },
  message: { type: String },
  ratingStatus: { type: String, enum: ['pending', 'approved'], default: 'pending' },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

const loadReview = async (reviewId) => {
    const dbReview = await Review.findOne({ _id: reviewId });
    if (dbReview) {
      return new Review({
        _id: dbReview._id,
        productId: dbReview.productId,
        productTitle: dbReview.productTitle,
        customerId: dbReview.customerId,
        customerName: dbReview.customerName,
        rating: dbReview.rating,
        message: dbReview.message,
        ratingStatus: dbReview.ratingStatus,
      });
    }
    return null;
  };

const storeReview = async (review) => {
    try {
      const filter = { _id: review._id };
      const replacement = {
        _id: review._id,
        productId: review.productId,
        productTitle: review.productTitle,
        customerId: review.customerId,
        customerName: review.customerName,
        rating: review.rating,
        message: review.message,
        ratingStatus: review.ratingStatus,
      };

      const options = { upsert: true, new: true };
      const dbReview = await Review.findOneAndReplace(
        filter,
        replacement,
        options
      );

      return dbReview;
    } catch (error) {
      console.error("Error storing session");
      return false;
    }
};

const getReviewsByProductId = async (productId) => {
  try {
    const reviews = await Review.find({ productId });
    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw new Error('Could not fetch reviews');
  }
};

const deleteReviewById = async (reviewId) => {
  try {
    const result = await Review.findByIdAndDelete(reviewId);
    if (!result) {
      throw new Error('Review not found');
    }
    return result;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw new Error('Could not delete review');
  }
};


export {loadReview, storeReview, getReviewsByProductId, deleteReviewById};