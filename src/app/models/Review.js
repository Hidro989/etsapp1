import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String },
  customerId: { type: String, required: true },
  email: { type: String, required: true },
  customerName: { type: String },
  customerEmail: { type: String, required: true },
  rating: { type: Number, required: true },
  message: { type: String },
  ratingStatus: { type: String, enum: ['pending', 'approved'], default: 'pending' },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

const approveReviewById = async (reviewId) => {
  try {
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { ratingStatus: 'approved' },
      { new: true }
    );
    
    if (!updatedReview) {
      throw new Error('Review not found');
    }
    
    return updatedReview;
  } catch (error) {
    console.error('Error approving review:', error);
    throw new Error('Could not approve review');
  }
};

const getAllReviews = async () => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    return reviews;
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    throw new Error('Could not fetch all reviews');
  }
};

const loadReview = async (reviewId) => {
    const dbReview = await Review.findOne({ _id: reviewId });
    if (dbReview) {
      return new Review({
        _id: dbReview._id,
        productId: dbReview.productId,
        productTitle: dbReview.productTitle,
        customerId: dbReview.customerId,
        customerName: dbReview.customerName,
        customerEmail: dbReview.customerEmail,
        rating: dbReview.rating,
        message: dbReview.message,
        ratingStatus: dbReview.ratingStatus,
      });
    }
    return null;
  };

const storeReview = async (review) => {
    try {
      const filter = { _id: review._id || undefined};
      const replacement = {
        _id: review._id,
        productId: review.productId,
        productTitle: review.productTitle,
        customerId: review.customerId,
        customerName: review.customerName,
        customerEmail: review.customerEmail,
        rating: review.rating,
        message: review.message,
        ratingStatus: review.ratingStatus || 'pending',
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
    const reviews = await Review.find({ productId, ratingStatus: 'approved' });
    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw new Error('Could not fetch reviews');
  }
};

const getReviewsByCustomerIdAndProductId = async (customerId,productId) => {
  try {
    const review = await Review.find({ customerId, productId });
    return review;
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


export {loadReview, storeReview, getReviewsByProductId, deleteReviewById, getReviewsByCustomerIdAndProductId, getAllReviews, approveReviewById};