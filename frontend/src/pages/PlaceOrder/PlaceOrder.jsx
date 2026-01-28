// import React, { useContext, useState } from 'react'
// import './PlaceOrder.css'
// import { StoreContext } from '../../context/StoreContext'
// import axios from 'axios';
// const PlaceOrder = () => {

// const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);


//   const [data,setData] = useState({
//     firstName:"",
//     lastName:"",
//     email:"",
//     street:"",
//     city:"",
//     state:"",
//     zipcode:"",
//     country:"",
//     phone:""

//   })

//   const onChangeHandler = (event) =>{
//     const name = event.target.name;
//     const value = event.target.value;

//     setData(data=>({...data,[name]:value}))
//   }

//   const placeOrder = async (event) => {
//     event.preventDefault();
//     let orderItems = [];
//     food_list.map((item)=>{
//       if(cartItems[item._id]>0){
//         let itemInfo = item;
//         itemInfo["quantity"] = cartItems[item._id]
//         orderItems.push(itemInfo)
//       }
//     })

//     let orderData = {
//       address:data,
//       items:orderItems,
//       amount:getTotalCartAmount()+2
//     }
//     try {
//         let response = await axios.post(url+"/api/order/place",orderData,{headers:{token}})
//         if(response.data.success){
          
//       }
// } catch (error) {
  
// }
//     
//     }
//   
//  


//   return (
//    <form onSubmit={placeOrder} className='place-order'>
//     <div className="place-order-left">
//       <p className="title">Dellivery Information</p>
//       <div className="multi-fields">
//         <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' /> 
//         <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name'/>
//       </div>
//       <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address'/>
//       <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street'/>
//       <div className="multi-fields">
//         <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' /> 
//         <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State'/>
//       </div>
//       <div className="multi-fields">
//         <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code' /> 
//         <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country'/>
//       </div>
//       <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone' />
//     </div>
//     <div className="place-order-right">
//         <div className="cart-total">
//           <h2>Cart Totals</h2>
//           <div>
//             <div className="cart-total-details">
//               <p>Subtotal</p>
//               <p>${getTotalCartAmount()}</p>
//             </div>
//             <hr />
//             <div className="cart-total-details">
//               <p>Delivery FEE</p>
//               <p>${getTotalCartAmount() === 0 ? 0:2}</p>
//             </div>
//             <hr />
//             <div className="cart-total-details">
//               <b>Total</b>
//               <b>${getTotalCartAmount() === 0 ? 0:getTotalCartAmount()+2}</b>
//             </div>
//           </div>
//             <button type='submit'>Proceed To Payment</button>
//         </div>
//     </div>
//    </form>
//   )
// }

// export default PlaceOrder
import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate


const PlaceOrder = () => {

  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
  const navigate = useNavigate(); // 2. Initialize navigate

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  // 3. Helper function to load Razorpay script dynamically
  // This avoids you having to touch index.html
  const loadRazorpayScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    // Load the Razorpay SDK script first
    const res = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    let orderItems = [];
    food_list.map((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = {
            ...item,
            quantity: cartItems[item._id]
          };
          orderItems.push(itemInfo);

      }
    })

    let orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 2,
    }

    try {
      // 4. Call Backend to create order
      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });

      if (response.data.success) {
        const { order } = response.data;

        // 5. Setup Razorpay Options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // REPLACE THIS with your actual Key ID
          amount: order.amount,
          currency: order.currency,
          name: "Food Delivery App",
          description: "Order Payment",
          order_id: order.id, // The Razorpay Order ID
          
          
          // 6. Handle Success Payment
          handler: async function (response) {
            try {
              const verifyUrl = url + "/api/order/verify";
              const { data } = await axios.post(verifyUrl, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.receipt // Pass the DB Order ID
              }, { headers: { token } });

              if (data.success) {
                navigate('/myorders'); // Redirect to My Orders page on success
              } else {
                alert("Payment verification failed");
                navigate('/');
              }
            } catch (error) {
              console.log(error);
              alert("Error verifying payment");
            }
          },
          prefill: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            contact: data.phone
          },
          theme: {
            color: "#3399cc"
          }
        };

        // 7. Open the Razorpay Window
        const paymentObject = new window.Razorpay(options);
         paymentObject.on("payment.failed", function (response) {
      alert("Payment failed");
      console.log(response.error);
        });
        paymentObject.open();

      }
      else {
        alert("Error placing order");
      }

    } catch (error) {
      console.log(error);
      alert("Error processing payment");
    }
  }

  

  useEffect(()=>{
    if(!token){
      navigate('/cart')
    }
    else if(getTotalCartAmount()===0){
      navigate('/cart')
    }
  },[token])

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' />
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' />
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address' />
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' />
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' />
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State' />
        </div>
        <div className="multi-fields">
          <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code' />
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' />
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone' />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
            </div>
          </div>
          <button type='submit'>Proceed To Payment</button>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder