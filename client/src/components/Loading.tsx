import React, { useEffect, useState } from "react";
import axios from "axios";
import './Loading.css'
import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';
// Kiểu dữ liệu cho User
type User = {
  id: number;
  name: string;
  email: string;
  age: number;
};





const Loading: React.FC = () => (
  <Flex align="center" gap="middle">

    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
  </Flex>
);

// Component chính
export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);

  async function getAllUser() {
    let result: User[] = [];

    try {
      const response = await axios.get("http://localhost:8080/user");
      result = response.data;
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      // Giả lập loading 2s
      setTimeout(() => {
        setUsers(result);
        setLoading(false);
      }, 2000);
    }
  }

  useEffect(() => {
    getAllUser();
  }, []);

  return (
    <div>
    
      {loading ? (
        <Loading />
      ) : (
        users.map((item) => (
          <div key={item.id}>
            {item.id} - {item.name} - {item.email}
          </div>
        ))
      )}
    </div>
  );
}

