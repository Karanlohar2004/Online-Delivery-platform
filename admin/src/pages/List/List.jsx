import React, { useEffect } from 'react'
import axios from 'axios'
import {toast} from 'react-toastify'
import { useState } from 'react'
import './List.css'

const List = ({url}) => {
  
  
  const [list,setList] = useState([]);


const fetchList = async () => {
  try {
    const response = await axios.get(`${url}/api/food/list`);
   // console.log("API RESPONSE 👉", response.data);


    if (response.data.Success) {
      setList(response.data.data);
    } else {
      toast.error("Failed to fetch food list");
    }
  } catch (error) {
    console.error(error);
    toast.error("Server error or API not reachable");
  }
};

const removeFood =  async(foodId) => { 
  const response = await axios.post(`${url}/api/food/remove`,{id:foodId})
  
  await fetchList();
  if(response.data.sucess){
    toast.success(response.data.message)
  }
  else{
    toast.error(response.data.message)
  }
}
  useEffect(()=>{
    fetchList();
  },[])


  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {
          list.map((item,index)=> {
            return ( 
              
              <div key={index} className='list-table-format'>
                <img src= {`${url}/images/`+item.image} alt="" />
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p><span>RS.</span>{item.price}</p>
                <p className='cursor'  onClick={()=>removeFood(item._id)}>X</p>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default List