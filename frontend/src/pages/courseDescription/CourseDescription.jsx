import React, { useEffect, useState } from "react";

import "./courseDescription.css";
import { useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { subscriptionIncludes } from "../../utils/subscription";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import Loading from "../../components/loding/Loading";

const CourseDescription = ({ user }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { fetchUser } = UserData();
  const { fetchCourse, course, fetchCourses, fetchMyCourse } = CourseData();
  useEffect(() => {
    fetchCourse(params.id);
  }, [params.id, fetchCourse]);

  const checkOutHandler = async () => {
    setLoading(true);
    try {
      const {
        data: { order, key },
      } = await api.post(`/api/course/checkout/${params.id}`, {});

      const options = {
        key, // Use the key returned from the backend response
        amount: order.amount, // Correct field
        currency: order.currency,
        name: "VidyaSetu",
        description: `Purchase ${course.title}`,
        order_id: order.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        handler: async function (response) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            response;
          try {
            const { data } = await api.post(`/api/verification/${params.id}`, {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            });
            await fetchUser();
            await fetchCourses();
            await fetchMyCourse();
            toast.success(data.message);
            setLoading(false);
            navigate(`/payment-success/${razorpay_payment_id}`);
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment failed");
            setLoading(false);
          }
        },
        theme: {
          color: "#3478f6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start checkout");
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          {course && (
            <div className="course-description">
              <div className="course-header">
                <img
                  src={resolveMediaUrl(course.image)}
                  alt=""
                  className="course-image"
                />
                <div className="course-info">
                  <p className="page-eyebrow">Explore the course</p>
                  <h1>{course.title}</h1>
                  <p>Instructor · {course.createdBy}</p>
                  <p>Duration · {course.duration} weeks</p>
                </div>
              </div>
              <p className="course-description-text">{course.description}</p>
              <p className="course-purchase-price">
                ₹{course.price}
                <small>One-time purchase</small>
              </p>
              {user && subscriptionIncludes(user.subscription, course._id) ? (
                <button
                  className="common-btn"
                  onClick={() => navigate(`/course/study/${course._id}`)}
                >
                  Study
                </button>
              ) : (
                <button onClick={checkOutHandler} className="common-btn">
                  Buy Now
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CourseDescription;
